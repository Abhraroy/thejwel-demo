import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Shipping Information",
  description: "Learn about shipping timelines, order processing, and delivery coverage at THE JWEL.",
  pathname: "/shipping",
});

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-theme-cream py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Shipping Information</h1>
        <p className="text-gray-700 leading-7">
        The orders for the user are shipped through registered domestic courier companies and/or speed post only. Orders are shipped and delivered within 3-7 days from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation and delivering of the shipment, subject to courier company / post office norms. Platform Owner shall not be liable for any delay in delivery by the courier company / postal authority. Delivery of all orders will be made to the address provided by the buyer at the time of purchase. Delivery of our services will be confirmed on your email ID as specified at the time of registration. If there are any shipping cost(s) levied by the seller or the Platform Owner (as the case be), the same is not refundable.
        </p>
      </div>
    </main>
  );
}
