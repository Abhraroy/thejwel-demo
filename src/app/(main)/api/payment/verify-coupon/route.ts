import { NextRequest, NextResponse } from "next/server";
import adminsupabase from "@/lib/supabase-Utils/admin";

export async function POST(request: NextRequest) {
  let couponCode: string | null = null;
  let orderTotal: number = 0;

  try {
    const body = await request.json();
    couponCode =
      typeof body?.coupon_code === "string" ? body.coupon_code.trim().toUpperCase() : null;
    orderTotal = typeof body?.order_total === "number" ? body.order_total : 0;
  } catch {
    return NextResponse.json(
      { valid: false, message: "Invalid request" },
      { status: 400 }
    );
  }

  if (!couponCode) {
    return NextResponse.json(
      { valid: false, message: "Please enter a coupon code" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
    return NextResponse.json(
      { valid: false, message: "Invalid order total" },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();
  const couponRes = await adminsupabase
    .from("coupons")
    .select(
      "coupon_code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, usage_count, valid_from, valid_until, is_active"
    )
    .eq("coupon_code", couponCode)
    .eq("is_active", true)
    .lte("valid_from", nowIso)
    .gte("valid_until", nowIso)
    .maybeSingle();

  if (couponRes.error || !couponRes.data) {
    return NextResponse.json(
      { valid: false, message: "Invalid or expired coupon code" },
      { status: 200 }
    );
  }

  const coupon = couponRes.data;
  const usageLimit = Number(coupon.usage_limit ?? 0);
  const usageCount = Number(coupon.usage_count ?? 0);
  if (usageLimit > 0 && usageCount >= usageLimit) {
    return NextResponse.json(
      { valid: false, message: "This coupon has reached its usage limit" },
      { status: 200 }
    );
  }

  const minPurchaseAmount = Number(coupon.min_purchase_amount ?? 0);
  if (orderTotal < minPurchaseAmount) {
    return NextResponse.json(
      {
        valid: false,
        message: `Minimum order of ₹${minPurchaseAmount.toFixed(2)} required for this coupon`,
      },
      { status: 200 }
    );
  }

  const discountValue = Number(coupon.discount_value ?? 0);
  let computedDiscount = 0;
  if (coupon.discount_type === "percentage") {
    computedDiscount = (orderTotal * discountValue) / 100;
  } else if (coupon.discount_type === "fixed") {
    computedDiscount = discountValue;
  }

  const maxDiscountAmount = Number(coupon.max_discount_amount ?? 0);
  if (maxDiscountAmount > 0) {
    computedDiscount = Math.min(computedDiscount, maxDiscountAmount);
  }

  computedDiscount = Math.max(
    0,
    Math.min(Number(computedDiscount.toFixed(2)), orderTotal)
  );
  const payableAmount = Math.max(0, Math.round(orderTotal - computedDiscount));

  return NextResponse.json({
    valid: true,
    coupon: {
      coupon_code: coupon.coupon_code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: discountValue,
      min_purchase_amount: minPurchaseAmount,
      max_discount_amount: maxDiscountAmount,
    },
    discount_amount: computedDiscount,
    payable_amount: payableAmount,
    offer_text:
      coupon.discount_type === "fixed"
        ? `₹${discountValue.toFixed(2)} off`
        : `${discountValue}% off`,
  });
}
