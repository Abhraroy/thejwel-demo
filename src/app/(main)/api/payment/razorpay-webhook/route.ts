import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { finalizePrepaidOrder } from "@/app/utils/finalizePrepaidOrder";

/**
 * Razorpay server-to-server webhook.
 *
 * This is the SAFETY NET for prepaid orders: if the customer's browser dies
 * after Razorpay captures the payment but before `complete-razorpay` runs
 * (common in Instagram/Facebook in-app browsers), this webhook recovers the
 * order from the Redis checkout context. It is idempotent with the client path
 * (both key on `transaction_id == razorpay_payment_id`).
 *
 * Configure in Razorpay Dashboard -> Settings -> Webhooks:
 *   URL:    https://<your-domain>/api/payment/razorpay-webhook
 *   Secret: RAZORPAY_WEBHOOK_SECRET
 *   Events: payment.captured, order.paid
 */

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[api/payment/razorpay-webhook]", ...args);
  }
};

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Read the RAW body for signature verification (must not be re-serialized).
  const rawBody = await request.text();

  if (!secret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ message: "Webhook not configured" }, { status: 500 });
  }

  if (!signature) {
    devLog("missing-signature");
    return NextResponse.json({ message: "Missing signature" }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const signatureValid =
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

  if (!signatureValid) {
    devLog("signature-mismatch");
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const eventType: string = event?.event ?? "";
  const paymentEntity = event?.payload?.payment?.entity;

  // We only act on a captured payment, which carries both ids we need.
  const razorpayPaymentId: string | undefined = paymentEntity?.id;
  const razorpayOrderId: string | undefined = paymentEntity?.order_id;

  devLog("event-received", { eventType, razorpayOrderId, razorpayPaymentId });

  if (
    (eventType === "payment.captured" || eventType === "order.paid") &&
    razorpayOrderId &&
    razorpayPaymentId
  ) {
    try {
      const result = await finalizePrepaidOrder({
        razorpayOrderId,
        razorpayPaymentId,
        source: "webhook",
      });

      if (!result.success) {
        // 410 = checkout context expired and no order exists -> can't recover
        // automatically. Log loudly; still ACK so Razorpay stops retrying a
        // permanently unrecoverable event (or return non-200 to allow retries).
        devLog("recovery-failed", {
          razorpayPaymentId,
          status: result.status,
          message: result.message,
        });
        if (result.status === 410) {
          console.error("[razorpay-webhook] UNRECOVERABLE payment without order", {
            razorpayOrderId,
            razorpayPaymentId,
          });
          return NextResponse.json({ received: true, recovered: false }, { status: 200 });
        }
        // Transient failure: return 500 so Razorpay retries later.
        return NextResponse.json({ received: true, recovered: false }, { status: 500 });
      }

      devLog("recovery-result", {
        razorpayPaymentId,
        alreadyExisted: result.alreadyExisted,
        orderId: result.order.order_id,
      });
      return NextResponse.json(
        { received: true, recovered: !result.alreadyExisted, order_id: result.order.order_id },
        { status: 200 }
      );
    } catch (error) {
      console.error("[razorpay-webhook] processing error:", error);
      return NextResponse.json({ received: true, recovered: false }, { status: 500 });
    }
  }

  // Acknowledge any other event types so Razorpay doesn't retry them.
  return NextResponse.json({ received: true }, { status: 200 });
}
