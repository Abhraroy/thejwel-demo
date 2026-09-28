import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-Utils/server";
import adminsupabase from "@/lib/supabase-Utils/admin";
import {
  createOrderWithItems,
  getCodShippingCost,
  prepareCheckoutContext,
} from "@/app/utils/orderCheckout";
import { sendPurchaseEvent } from "@/lib/meta/capi";
import { decrementStockForOrderItems } from "@/app/utils/stockAdjustment";

const COD_ORDER_PREFIX = "COD";
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[api/payment/cod]", ...args);
  }
};

export async function POST(request: NextRequest) {
  const userSupabase = await createClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user?.phone) {
    devLog("unauthenticated-user");
    return NextResponse.json(
      { message: "User is not authenticated found" },
      { status: 404 }
    );
  }

  let addressId: string | null = null;
  let couponCode: string | null = null;
  let attribution: Record<string, unknown> | null = null;
  try {
    const body = await request.json();
    addressId = body?.address_id ?? null;
    couponCode =
      typeof body?.coupon_code === "string" ? body.coupon_code.trim() : null;
    attribution =
      body?.attribution && typeof body.attribution === "object" ? body.attribution : null;
  } catch {
    devLog("invalid-json");
    return NextResponse.json(
      { message: "No address_id in request body or invalid JSON" },
      { status: 400 }
    );
  }

  if (!addressId) {
    devLog("missing-address-id");
    return NextResponse.json(
      { message: "Shipping address is required" },
      { status: 400 }
    );
  }

  const contextRes = await prepareCheckoutContext("+" + user.phone, addressId);
  if (!contextRes.success) {
    devLog("prepareCheckoutContext-failed", {
      status: contextRes.status,
      message: contextRes.message,
    });
    return NextResponse.json(
      { message: contextRes.message },
      { status: contextRes.status }
    );
  }

  const context = contextRes.data;
  let totalAmount = context.totalAmount;

  if (couponCode) {
    devLog("coupon-check:start", { couponCode });
    const nowIso = new Date().toISOString();
    const couponRes = await adminsupabase
      .from("coupons")
      .select(
        "coupon_code, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, usage_count, is_active, valid_from, valid_until"
      )
      .eq("coupon_code", couponCode)
      .eq("is_active", true)
      .lte("valid_from", nowIso)
      .gte("valid_until", nowIso)
      .maybeSingle();

    if (!couponRes.error && couponRes.data) {
      const coupon = couponRes.data;
      const usageLimit = Number(coupon.usage_limit ?? 0);
      const usageCount = Number(coupon.usage_count ?? 0);
      const minPurchaseAmount = Number(coupon.min_purchase_amount ?? 0);

      if ((usageLimit <= 0 || usageCount < usageLimit) && context.totalAmount >= minPurchaseAmount) {
        const discountValue = Number(coupon.discount_value ?? 0);
        let computedDiscount = 0;
        if (coupon.discount_type === "percentage") {
          computedDiscount = (context.totalAmount * discountValue) / 100;
        } else if (coupon.discount_type === "fixed") {
          computedDiscount = discountValue;
        }

        const maxDiscountAmount = Number(coupon.max_discount_amount ?? 0);
        if (maxDiscountAmount > 0) {
          computedDiscount = Math.min(computedDiscount, maxDiscountAmount);
        }

        computedDiscount = Math.max(0, Math.min(computedDiscount, context.totalAmount));
        totalAmount = Math.max(0, Math.round(context.totalAmount - computedDiscount));
        devLog("coupon-check:applied", {
          couponCode,
          originalTotal: context.totalAmount,
          totalAmount,
        });
      }
    }
  }

  const payableContext = {
    ...context,
    totalAmount,
    amountInPaise: Math.round(totalAmount * 100),
  };

  const now = Date.now();
  const codOrderNumber = `${COD_ORDER_PREFIX}-${context.user.user_id.slice(0, 8)}-${now}`;

  // Server-side duplicate guard for accidental double-clicks.
  const twoSecondsAgo = new Date(now - 2 * 1000).toISOString();
  const duplicateRes = await adminsupabase
    .from("orders")
    .select("order_id, order_number, total_amount, order_date")
    .eq("user_id", context.user.user_id)
    .eq("shipping_address_id", context.addressId)
    .eq("payment_status", "pending(cod)")
    .eq("order_status", "pending")
    .gte("order_date", twoSecondsAgo)
    .like("order_number", `${COD_ORDER_PREFIX}-%`)
    .order("order_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!duplicateRes.error && duplicateRes.data) {
    devLog("duplicate-cod-detected", {
      userId: context.user.user_id,
      orderId: duplicateRes.data.order_id,
      orderNumber: duplicateRes.data.order_number,
    });
    return NextResponse.json(
      {
        message: "COD order already created",
        orderId: duplicateRes.data.order_id,
        orderNumber: duplicateRes.data.order_number,
        // Same event_id so a late Pixel fire still dedupes with the first CAPI send.
        eventId: duplicateRes.data.order_id,
        purchaseValue: Number(duplicateRes.data.total_amount) || 0,
      },
      { status: 200 }
    );
  }

  const shipping_cost = getCodShippingCost(context.totalAmount);

  if (shipping_cost > 0) {
    devLog("cod-blocked:shipping-payment-required", {
      totalAmount: context.totalAmount,
      shipping_cost,
    });
    return NextResponse.json(
      {
        message:
          "COD shipping charges must be paid online before placing this order",
      },
      { status: 403 }
    );
  }

  const orderRes = await createOrderWithItems(payableContext, {
    orderNumber: codOrderNumber,
    paymentStatus: "pending(cod)",
    orderStatus: "pending",
    shipping_cost: shipping_cost ?? 0,
  });

  if (!orderRes.success) {
    devLog("createOrderWithItems-failed", { message: orderRes.message, status: orderRes.status });
    return NextResponse.json(
      { message: orderRes.message },
      { status: orderRes.status }
    );
  }
  devLog("cod-order-created", {
    orderId: orderRes.order.order_id,
    orderNumber: orderRes.order.order_number,
    userId: context.user.user_id,
    shipping_cost: orderRes.order.shipping_cost,
  });

  await decrementStockForOrderItems(orderRes.orderItemsPayload ?? []);

  const purchaseValue = Number(payableContext.totalAmount) || 0;
  const contentIds = (orderRes.orderItemsPayload ?? [])
    .map((item: any) => item.product_id)
    .filter(Boolean);

  // Meta Conversions API (source of truth). Fired at COD placement so ad
  // optimization sees the conversion immediately. Never blocks the order.
  // This path is COD with free shipping only (shipping_cost === 0).
  try {
    await sendPurchaseEvent({
      eventId: orderRes.order.order_id,
      value: purchaseValue,
      currency: "INR",
      contentIds,
      user: {
        email: context.user?.email,
        phone: context.user?.phone_number,
        firstName: context.user?.first_name,
        lastName: context.user?.last_name,
      },
      attribution: attribution as any,
    });
  } catch (capiError) {
    devLog("capi-error", { orderId: orderRes.order.order_id, error: capiError });
  }

  return NextResponse.json(
    {
      message: "COD order created successfully",
      orderId: orderRes.order.order_id,
      orderNumber: orderRes.order.order_number,
      // event_id == order_id so the client Pixel Purchase dedupes with CAPI.
      eventId: orderRes.order.order_id,
      purchaseValue,
      contentIds,
    },
    { status: 200 }
  );
}
