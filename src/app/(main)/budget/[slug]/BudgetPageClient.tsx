"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ProductCard from "@/components/ProductUI/ProductCard";
import { productWithImages } from "@/types/RelationTypeInterface";

type BudgetPageClientProps = {
  rangeLabel: string;
  rangeText: string;
  initialProducts: productWithImages[];
};

export default function BudgetPageClient({
  rangeLabel,
  rangeText,
  initialProducts,
}: BudgetPageClientProps) {
  const [selectedSort, setSelectedSort] = useState<string>("featured");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [products] = useState<productWithImages[]>(initialProducts ?? []);
  const params = useParams();
  const slug = params?.slug as string | undefined;

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
  ];

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (selectedSort) {
      case "price-low":
        sorted.sort((a, b) => (a.final_price ?? 0) - (b.final_price ?? 0));
        break;
      case "price-high":
        sorted.sort((a, b) => (b.final_price ?? 0) - (a.final_price ?? 0));
        break;
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.updated_at ?? "").getTime() - new Date(a.updated_at ?? "").getTime()
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [products, selectedSort]);

  return (
    <div className="min-h-screen bg-theme-cream">
      <main className="w-full">
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  {rangeLabel}
                </h1>
                <p className="text-gray-500 text-sm mt-1">{rangeText}</p>
                <p className="text-gray-500 text-sm mt-0.5">
                  {sortedProducts.length} products available
                </p>
              </div>

              <div className="shrink-0 relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-[#360000] bg-white border border-theme-sage/30 rounded-lg hover:border-theme-olive hover:text-[#360000] transition-all"
                >
                  <span className="hidden md:inline">
                    {sortOptions.find((opt) => opt.value === selectedSort)?.label || "Sort"}
                  </span>
                  <span className="md:hidden">Sort</span>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <div className="py-1">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSelectedSort(option.value);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              selectedSort === option.value
                                ? "bg-theme-sage text-white"
                                : "text-[#360000] hover:bg-theme-cream"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6">
            <p className="text-gray-600 text-sm">
              Showing{" "}
              <span className="font-semibold text-gray-900">{sortedProducts.length}</span> products
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {sortedProducts.map((product, index) => (
              <ProductCard key={`${product.product_id}-${index}`} product={product} />
            ))}
          </div>

          {sortedProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No products found in this price range.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
