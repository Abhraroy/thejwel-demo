"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductUI/ProductCard";
import { ArrowLeft } from "lucide-react";

type RecommendedPageClientProps = {
  productName: string | null;
  productId: string;
  products: any[];
  error?: string | null;
};

export default function RecommendedPageClient({
  productName,
  productId,
  products,
  error,
}: RecommendedPageClientProps) {
  if (error) {
    return (
      <div className="min-h-screen bg-theme-cream flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-theme-sage hover:bg-theme-olive text-white font-medium rounded-lg transition-colors duration-200"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-cream">
      <main className="w-full">
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-4">
            <Link
              href={`/product/${productId}`}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to product
            </Link>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  Recommended Products
                </h1>
                {productName ? (
                  <p className="text-gray-500 text-sm mt-1">Based on {productName}</p>
                ) : null}
                <p className="text-gray-500 text-sm mt-1">
                  {products.length} product{products.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product: any, index: number) => (
              <ProductCard key={product?.product_id ?? index} product={product} />
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No recommended products found.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
