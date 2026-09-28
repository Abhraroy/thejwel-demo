import crypto from "crypto"
import { NextResponse } from "next/server"

export async function POST(req: Request) {

    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
    } = await req.json()

    const body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest("hex")

    if (expectedSignature === razorpay_signature) {
        return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false })
}