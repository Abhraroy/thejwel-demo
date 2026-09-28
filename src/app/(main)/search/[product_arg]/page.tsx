"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-Utils/client";
import ProductCard from "@/components/ProductUI/ProductCard";
import Footer from "@/components/Footer";

const SearchResultsSkeleton = () => {
  return (
    <div className="min-h-screen bg-theme-cream">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-4">
          <div className="flex items-center justify-between gap-4 animate-pulse">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-8 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
            </div>
            <div className="h-10 w-28 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCard key={idx} product={{}} isLoading />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default function SearchPage() {
  const params = useParams();
  const product_arg = (params?.product_arg as string) ?? "";
  const decodedArg = decodeURIComponent(product_arg);

  const supabase = createClient();
  const [searchProducts, setSearchProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      setSearchProducts([]);

      try {
        const q = decodedArg.trim();
        if (!q) {
          setSearchProducts([]);
          return;
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "product_search_vector_func",
          {
            q,
            result_limit: 200,
          }
        );

        if (!rpcError) {
          setSearchProducts((rpcData as any[]) || []);
          return;
        }

        const pattern = `%${q}%`;
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("products")
          .select(
            `
            *,
            product_images(*),
            categories(*)
          `
          )
          .or(
            [
              `product_name.ilike.${pattern}`,
              `description.ilike.${pattern}`,
              `sku.ilike.${pattern}`,
            ].join(",")
          )
          .eq("listed_status", true)
          .order("updated_at", { ascending: false });

        if (fallbackError) {
          setError("Failed to load search results. Please try again.");
          setSearchProducts([]);
          return;
        }

        setSearchProducts(fallbackData || []);
      } catch {
        setError("An error occurred while loading this page.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [decodedArg, supabase]);

  if (loading) {
    return <SearchResultsSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-theme-cream flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Search Failed
          </h2>
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

  const q = decodedArg.trim();
  const results = searchProducts || [];

  return (
    <div className="min-h-screen bg-theme-cream">
      <main className="w-full">
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  Search results for &quot;{q}&quot;
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {results.length} products available
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6">
            <p className="text-gray-600 text-sm">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {results.length}
              </span>{" "}
              products
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {results.map((product: any, index: number) => (
              <ProductCard key={product?.product_id ?? index} product={product} />
            ))}
          </div>

          {results.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                No products found matching &quot;{q}&quot;.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

