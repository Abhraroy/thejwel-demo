import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-Utils/server";
import adminsupabase from "@/lib/supabase-Utils/admin";

export async function GET() {
  const userSupabase = await createClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "User is not authenticated" },
      { status: 401 }
    );
  }

  const nowIso = new Date().toISOString();
  const couponRes = await adminsupabase
    .from("coupons")
    .select(
      "coupon_code, coupon_type, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, usage_count, valid_from, valid_until, is_active"
    )
    .eq("coupon_type", "PREPAID")
    .eq("is_active", true)
    .lte("valid_from", nowIso)
    .gte("valid_until", nowIso)
    .order("valid_until", { ascending: true })
    .limit(20);

  if (couponRes.error || !couponRes.data || couponRes.data.length === 0) {
    return NextResponse.json({ message: "No prepaid offer available" }, { status: 404 });
  }

  const coupon =
    couponRes.data.find((item) => {
      const usageLimit = Number(item.usage_limit ?? 0);
      const usageCount = Number(item.usage_count ?? 0);
      return usageLimit <= 0 || usageCount < usageLimit;
    }) ?? null;

  if (!coupon) {
    return NextResponse.json({ message: "No prepaid offer available" }, { status: 404 });
  }

  return NextResponse.json({ coupon }, { status: 200 });
}
