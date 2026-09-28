import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { finalizePrepaidOrder } from "@/app/utils/finalizePrepaidOrder";

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[api/payment/complete-razorpay]", ...args);
  }
};

export async function POST(request: NextRequest) {
  let razorpayOrderId: string | null = null;
  let razorpayPaymentId: string | null = null;
  let razorpaySignature: string | null = null;

  try {
    const body = await request.json();
    razorpayOrderId =
      typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : null;
    razorpayPaymentId =
      typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : null;
    razorpaySignature =
      typeof body?.razorpay_signature === "string" ? body.razorpay_signature : null;
  } catch {
    devLog("invalid-json");
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    devLog("missing-fields", {
      razorpayOrderId,
      razorpayPaymentId,
      hasSignature: Boolean(razorpaySignature),
    });
    return NextResponse.json(
      { message: "Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature" },
      { status: 400 }
    );
  }

  const signBody = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(signBody)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    devLog("signature-mismatch", { razorpayOrderId, razorpayPaymentId });
    return NextResponse.json({ message: "Invalid payment signature" }, { status: 400 });
  }

  const result = await finalizePrepaidOrder({
    razorpayOrderId,
    razorpayPaymentId,
    source: "client",
  });

  if (!result.success) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json(
    {
      order_id: result.order.order_id,
      order_number: result.order.order_number,
      // event_id == order_id so the client Pixel Purchase dedupes with CAPI.
      event_id: result.order.order_id,
      // Same value CAPI used (PREPAID merchandise, or COD + shipping fee).
      purchase_value: result.purchaseValue,
      content_ids: result.contentIds,
      already_existed: result.alreadyExisted,
    },
    { status: 200 }
  );
}
