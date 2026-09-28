import Razorpay from "razorpay";

const keyId =
  process.env.RAZORPAY_KEY_ID?.trim() ||
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ||
  "";
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";

const razorpayInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default razorpayInstance;
