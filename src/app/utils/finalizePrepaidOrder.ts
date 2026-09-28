import "server-only";
import adminsupabase from "@/lib/supabase-Utils/admin";
import { createOrderWithItems, getCodShippingCost } from "@/app/utils/orderCheckout";
import { SHIPPING_FEE } from "@/lib/shipping-config";
import { redis } from "@/app/utils/Redis";
import { createRapidShypOrderForOrder } from "@/app/utils/rapidShyp";
import { sendPurchaseEvent } from "@/lib/meta/capi";
import type { AttributionPayload } from "@/lib/attribution";
import { decrementStockForOrderItems } from "@/app/utils/stockAdjustment";

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[finalizePrepaidOrder]", ...args);
  }
};

export type FinalizePrepaidResult =
  | {
      success: true;
      alreadyExisted: boolean;
      order: { order_id: string; order_number: string | null };
      /** Order value sent to Meta (products + COD shipping fee when applicable). */
      purchaseValue: number;
      contentIds: string[];
    }
  | { success: false; message: string; status: number };

interface StoredCheckoutData {
  context: any;
  couponCode: string | null;
  attribution?: Partial<AttributionPayload> | null;
  paymentType?: "PREPAID" | "COD_SHIPPING";
}

/**
 * Idempotently turn a captured Razorpay payment into a DB order, then fire the
 * server Conversions API. Shared by:
 *   - POST /api/payment/complete-razorpay (client-driven happy path)
 *   - POST /api/payment/razorpay-webhook  (server-driven recovery path)
 *
 * Idempotency is keyed on `transaction_id == razorpay_payment_id`, so whichever
 * path runs first wins and the other is a no-op.
 */
export async function finalizePrepaidOrder(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  source: "client" | "webhook";
}): Promise<FinalizePrepaidResult> {
  const { razorpayOrderId, razorpayPaymentId, source } = params;

  const redisKey = `razorpay_checkout:${razorpayOrderId}`;
  const storedData = await redis.get<string>(redisKey);

  // Idempotency check first so recovery still works after the Redis TTL.
  const existingOrder = await adminsupabase
    .from("orders")
    .select("order_id, order_number")
    .eq("transaction_id", razorpayPaymentId)
    .maybeSingle();

  if (!existingOrder.error && existingOrder.data) {
    devLog("already-existed", {
      source,
      razorpayPaymentId,
      orderId: existingOrder.data.order_id,
    });
    if (storedData) await redis.del(redisKey);
    return {
      success: true,
      alreadyExisted: true,
      order: {
        order_id: existingOrder.data.order_id,
        order_number: existingOrder.data.order_number ?? null,
      },
      // CAPI already fired on first create; Pixel uses these for dedupe only.
      purchaseValue: 0,
      contentIds: [],
    };
  }

  if (!storedData) {
    devLog("checkout-session-expired", { source, redisKey });
    return { success: false, message: "Checkout session expired", status: 410 };
  }

  let checkoutData: StoredCheckoutData;
  try {
    checkoutData =
      typeof storedData === "string" ? JSON.parse(storedData) : (storedData as StoredCheckoutData);
  } catch {
    devLog("invalid-checkout-data", { source, redisKey });
    return { success: false, message: "Invalid checkout data", status: 500 };
  }

  const { context: payableContext, couponCode, attribution, paymentType } = checkoutData;
  if (!payableContext) {
    devLog("missing-payable-context", { source, redisKey });
    return { success: false, message: "Invalid checkout context", status: 500 };
  }

  const resolvedPaymentType = paymentType ?? "PREPAID";
  const orderNumber =
    resolvedPaymentType === "COD_SHIPPING"
      ? `COD-${payableContext.user.user_id.slice(0, 8)}-${Date.now()}`
      : `PREPAID-${payableContext.user.user_id.slice(0, 8)}-${Date.now()}`;

  const shippingCost =
    resolvedPaymentType === "COD_SHIPPING"
      ? getCodShippingCost(Number(payableContext.totalAmount) || 0) || SHIPPING_FEE
      : 0;

  const orderRes = await createOrderWithItems(payableContext, {
    orderNumber,
    paymentStatus: resolvedPaymentType === "COD_SHIPPING" ? "pending(cod)" : "confirm",
    orderStatus: resolvedPaymentType === "COD_SHIPPING" ? "pending" : "processing",
    transactionId: razorpayPaymentId,
    couponCode: couponCode ?? undefined,
    shipping_cost: shippingCost ?? 0,
  });

  if (!orderRes.success) {
    devLog("createOrderWithItems-failed", {
      source,
      razorpayPaymentId,
      message: orderRes.message,
      status: orderRes.status,
    });
    return { success: false, message: orderRes.message, status: orderRes.status };
  }

  const order = orderRes.order;
  const contentIds = (orderRes.orderItemsPayload ?? [])
    .map((item: any) => item.product_id)
    .filter(Boolean) as string[];
  // Meta Purchase value = merchandise total + COD shipping fee (when charged).
  const purchaseValue =
    (Number(payableContext.totalAmount) || 0) + (Number(shippingCost) || 0);

  devLog("order-created", {
    source,
    orderId: order.order_id,
    orderNumber: order.order_number,
    transactionId: razorpayPaymentId,
    paymentType: resolvedPaymentType,
    purchaseValue,
  });

  await decrementStockForOrderItems(orderRes.orderItemsPayload ?? []);

  // --- Coupon usage ---
  const appliedCouponCode =
    couponCode && typeof couponCode === "string" && couponCode.trim().length > 0
      ? couponCode.trim()
      : null;
  if (appliedCouponCode) {
    try {
      const { data: couponRow } = await adminsupabase
        .from("coupons")
        .select("usage_count")
        .eq("coupon_code", appliedCouponCode)
        .maybeSingle();
      if (couponRow) {
        const usageCount = Number(couponRow.usage_count ?? 0);
        await adminsupabase
          .from("coupons")
          .update({ usage_count: Math.max(0, usageCount + 1) })
          .eq("coupon_code", appliedCouponCode);
      }
    } catch (couponError) {
      devLog("coupon-usage-update-failed", { source, appliedCouponCode, error: couponError });
      console.error("Failed to update coupon usage count:", couponError);
    }
  }

  // --- Shipping ---
  try {
    await createRapidShypOrderForOrder(
      order.order_id,
      resolvedPaymentType === "COD_SHIPPING" ? "COD" : "PREPAID"
    );
  } catch (rapidShypError) {
    devLog("rapidshyp-create-failed", { source, orderId: order.order_id, error: rapidShypError });
    console.error("RapidShyp order creation error:", rapidShypError);
  }

  // --- Meta Conversions API (source of truth; never blocks the order) ---
  // Covers PREPAID and COD_SHIPPING (COD with online shipping fee).
  try {
    await sendPurchaseEvent({
      eventId: order.order_id,
      value: purchaseValue,
      currency: "INR",
      contentIds,
      user: {
        email: payableContext.user?.email,
        phone: payableContext.user?.phone_number,
        firstName: payableContext.user?.first_name,
        lastName: payableContext.user?.last_name,
      },
      attribution: attribution ?? null,
    });
  } catch (capiError) {
    devLog("capi-error", { source, orderId: order.order_id, error: capiError });
  }

  await redis.del(redisKey);
  devLog("checkout-session-cleared", { source, redisKey, orderId: order.order_id });

  return {
    success: true,
    alreadyExisted: false,
    order: { order_id: order.order_id, order_number: order.order_number ?? null },
    purchaseValue,
    contentIds,
  };
}
