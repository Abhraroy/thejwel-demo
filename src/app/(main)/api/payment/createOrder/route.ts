import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-Utils/server";
import adminsupabase from "@/lib/supabase-Utils/admin";
import {
  COD_SHIPPING_FEE,
  getCodShippingCost,
  prepareCheckoutContext,
} from "@/app/utils/orderCheckout";
import razorpayInstance from "@/app/utils/RazorPay";
import { redis } from "@/app/utils/Redis";

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[api/payment/createOrder]", ...args);
  }
};

export async function POST(request: NextRequest) {
  const userSupabase = await createClient();
  let addressId: string | null = null;
  let couponCode: string | null = null;
  let attribution: Record<string, unknown> | null = null;
  let paymentType: "PREPAID" | "COD_SHIPPING" | null = "PREPAID";
  try {
    const body = await request.json();
    addressId = body?.address_id ?? null;
    couponCode =
      typeof body?.coupon_code === "string" ? body.coupon_code.trim() : null;
    attribution =
      body?.attribution && typeof body.attribution === "object" ? body.attribution : null;
    paymentType = typeof body?.payment_type === "string" ? body.payment_type.trim() as "PREPAID" | "COD_SHIPPING" : "PREPAID";
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

  const {
    data: { user },
  } = await userSupabase.auth.getUser();
  if (!user?.phone) {
    devLog("unauthenticated-user");
    return NextResponse.json(
      { message: "User is not authenticated" },
      { status: 404 }
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
  const codShippingCost = getCodShippingCost(context.totalAmount);

  if (paymentType === "COD_SHIPPING") {
    if (codShippingCost <= 0) {
      devLog("cod-shipping:not-applicable", {
        totalAmount: context.totalAmount,
      });
      return NextResponse.json(
        {
          message:
            "COD shipping payment is not required for this order total",
        },
        { status: 400 }
      );
    }
  }

  let discountedTotalAmount = context.totalAmount;
  let discountedAmountInPaise = context.amountInPaise;

  if (paymentType === "PREPAID" && couponCode) {
    devLog("coupon-check:start", { couponCode });
    const nowIso = new Date().toISOString();
    const couponRes = await adminsupabase
      .from("coupons")
      .select(
        "coupon_code, coupon_type, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, usage_count, is_active, valid_from, valid_until"
      )
      .eq("coupon_code", couponCode)
      .eq("coupon_type", "PREPAID")
      .eq("is_active", true)
      .lte("valid_from", nowIso)
      .gte("valid_until", nowIso)
      .maybeSingle();

    if (couponRes.error || !couponRes.data) {
      devLog("coupon-check:invalid", { couponCode, error: couponRes.error?.message });
      return NextResponse.json(
        {
          message:
            "Coupon is invalid, expired, or not valid for prepaid payment",
        },
        { status: 400 }
      );
    }

    const coupon = couponRes.data;
    const usageLimit = Number(coupon.usage_limit ?? 0);
    const usageCount = Number(coupon.usage_count ?? 0);
    if (usageLimit > 0 && usageCount >= usageLimit) {
      devLog("coupon-check:limit-reached", { couponCode, usageLimit, usageCount });
      return NextResponse.json(
        { message: "Coupon usage limit reached" },
        { status: 400 }
      );
    }

    const minPurchaseAmount = Number(coupon.min_purchase_amount ?? 0);
    if (context.totalAmount < minPurchaseAmount) {
      devLog("coupon-check:min-purchase-failed", {
        couponCode,
        totalAmount: context.totalAmount,
        minPurchaseAmount,
      });
      return NextResponse.json(
        { message: `Minimum purchase should be ₹${minPurchaseAmount}` },
        { status: 400 }
      );
    }

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

    computedDiscount = Math.max(
      0,
      Math.min(computedDiscount, context.totalAmount)
    );
    discountedTotalAmount = Math.max(
      0,
      Math.round(context.totalAmount - computedDiscount)
    );
    discountedAmountInPaise = discountedTotalAmount * 100;
    devLog("coupon-check:applied", {
      couponCode,
      discountedTotalAmount,
      discountedAmountInPaise,
    });
  }

  const payableContext = {
    ...context,
    totalAmount: discountedTotalAmount,
    amountInPaise: discountedAmountInPaise,
  };

  const checkoutData = {
    paymentType: paymentType,
    context: payableContext,
    couponCode: couponCode ?? null,
    attribution: attribution ?? null,
  };

  try {
    const receipt = crypto.randomUUID().replace(/-/g, "");
    const razorpayAmount =
      paymentType === "COD_SHIPPING"
        ? COD_SHIPPING_FEE * 100
        : payableContext.amountInPaise;
    const razorpayOptions = {
      amount: razorpayAmount,
      currency: "INR",
      receipt,
    };
    const razorpayOrder = await razorpayInstance.orders.create(razorpayOptions);
    devLog("razorpay-order-created", {
      razorpayOrderId: razorpayOrder.id,
      amountInPaise: razorpayAmount,
      userId: payableContext.user.user_id,
    });

    const redisKey = `razorpay_checkout:${razorpayOrder.id}`;
    await redis.set(redisKey, JSON.stringify(checkoutData), { ex: 1800 });
    devLog("checkout-session-saved", { redisKey, ttlSeconds: 1800 });

    return NextResponse.json(
      {
        total_amount: payableContext.totalAmount,
        amount_in_paise: razorpayAmount,
        address_id: payableContext.addressId,
        address_text: payableContext.addressText,
        user_id: payableContext.user.user_id,
        razorpay_order_id: razorpayOrder.id,
        razorpay_order: razorpayOrder,
      },
      { status: 200 }
    );
  } catch (razorpayError: unknown) {
    devLog("razorpay-order-create-failed", { error: razorpayError });
    console.error("Razorpay order creation failed:", razorpayError);
    return NextResponse.json(
      { message: "Failed to create payment order", error: razorpayError },
      { status: 500 }
    );
  }
}
