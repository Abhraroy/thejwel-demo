import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Us",
  description:
    "Learn about THE JWEL, our craftsmanship, and our mission to blend traditional elegance with modern jewellery design.",
  pathname: "/about",
});

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-theme-cream py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">About THE JWEL</h1>
        <p className="text-gray-700 leading-7">
          THE JWEL is a Kolkata-based jewellery brand focused on timeless design, quality craftsmanship,
          and dependable customer experience. We curate American Diamond and Temple jewellery for everyday
          elegance and special occasions.
        </p>
      </div>
    </main>
  );
}
