"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import OptimizedImage from "../OptimizedImage";
import { createClient } from "@/lib/supabase-Utils/client";

type Product = {
  product_id: string | number;
  product_name?: string;
  base_price?: number | string;
  final_price?: number | string;
  thumbnail_image?: string;
  discount_percentage?: number | string;
};

type PriceRange = { min: number; max: number };

const SCROLL_STEP = 256;
const SCROLL_TOLERANCE = 1;
const RESULT_LIMIT = 8;

const MID_RANGE_PRESETS: PriceRange[] = [
  { min: 100, max: 500 },
  { min: 300, max: 800 },
  { min: 400, max: 800 },
  { min: 500, max: 1000 },
  { min: 800, max: 1500 },
  { min: 1000, max: 2000 },
  { min: 1500, max: 3000 },
];

const BROAD_MID_RANGE: PriceRange = { min: 100, max: 3000 };

function pickRandomPriceRange(): PriceRange {
  return MID_RANGE_PRESETS[Math.floor(Math.random() * MID_RANGE_PRESETS.length)];
}

type SameCategoryProductProps = {
  categoryId: string;
  currentProductId: string;
  categorySlug?: string;
  categoryName?: string;
};

export default function SameCategoryProduct({
  categoryId,
  currentProductId,
  categorySlug,
  categoryName,
}: SameCategoryProductProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const fetchProducts = useCallback(
    async (range?: PriceRange) => {
      const supabase = createClient();
      let query = supabase
        .from("products")
        .select(
          "product_id, product_name, base_price, discount_percentage, final_price, thumbnail_image"
        )
        .eq("category_id", categoryId)
        .eq("listed_status", true)
        .neq("product_id", currentProductId)
        .order("updated_at", { ascending: false })
        .limit(RESULT_LIMIT);

      if (range) {
        query = query.gte("final_price", range.min).lte("final_price", range.max);
      }

      const { data, error } = await query;
      if (error) return [];
      return (data as Product[]) || [];
    },
    [categoryId, currentProductId]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const randomRange = pickRandomPriceRange();
      let results = await fetchProducts(randomRange);

      if (results.length < RESULT_LIMIT) {
        const broaderResults = await fetchProducts(BROAD_MID_RANGE);
        if (broaderResults.length > results.length) {
          results = broaderResults;
        }
      }

      if (results.length === 0) {
        results = await fetchProducts();
      }

      setProducts(results);
      setLoading(false);
    };

    load();
  }, [fetchProducts]);

  const updateScrollButtons = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > SCROLL_TOLERANCE);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - SCROLL_TOLERANCE);
  }, []);

  useEffect(() => {
    updateScrollButtons();
  }, [updateScrollButtons, products]);

  const handleScroll = useCallback((direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction === "left" ? -SCROLL_STEP : SCROLL_STEP,
      behavior: "smooth",
    });
  }, []);

  if (loading || products.length === 0) {
    return null;
  }

  const heading = categoryName ? `More in ${categoryName}` : "Same Category Products";

  return (
    <div className=" p-2 flex items-center justify-center">
      <div
        className="w-full max-h-fit md:w-2/3 lg:w-2/3 px-6 py-6 flex flex-col overflow-hidden shrink-0 gap-4 border shadow-md rounded-md
      "
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{heading}</h2>
          {categorySlug ? (
            <Link
              href={`/category/${categorySlug}`}
              className="text-xs text-[#360000] hover:text-[#360000]/80"
            >
              View All
            </Link>
          ) : null}
        </div>
        <div className="relative flex gap-4 max-w-full items-center">
          <div
            className={`hidden lg:flex w-fit h-fit cursor-pointer ${canScrollLeft ? "opacity-100" : "opacity-50 cursor-not-allowed"}`}
            onClick={() => handleScroll("left")}
          >
            <ChevronLeft className="w-10 h-10 text-black" />
          </div>
          <div
            className="flex-1 flex min-w-0 overflow-x-auto gap-4 items-center w-full scrollbar-hide "
            ref={scrollRef}
            onScroll={updateScrollButtons}
          >
            {products.map((product) => (
              <Link
                key={product.product_id}
                href={`/product/${product.product_id}`}
                className="shrink-0 w-60 h-fit rounded-md flex flex-col relative justify-start"
              >
                <div className="w-full h-70 relative">
                  <OptimizedImage
                    src={product.thumbnail_image ?? ""}
                    alt={product.product_name ?? ""}
                    preset="card"
                    objectFit="cover"
                    fill
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <div className="w-full h-[10%] flex flex-col gap-1 text-black">
                  <h3 className="text-[1rem] font-bold text-wrap">{product.product_name}</h3>
                  <span className="text-[1rem] text-black font-bold">
                    {product.discount_percentage}% OFF
                  </span>
                  <p className="flex gap-1 items-center">
                    <span className="text-[0.9rem] text-gray-500 line-through">
                      ₹{product.base_price}
                    </span>
                    <span className="text-[1.1rem] text-black font-bold">{product.final_price}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div
            className={`hidden lg:flex w-fit h-fit cursor-pointer ${canScrollRight ? "opacity-100" : "opacity-50 cursor-not-allowed"}`}
            onClick={() => handleScroll("right")}
          >
            <ChevronRight className="w-10 h-10 text-black" />
          </div>
        </div>
      </div>
    </div>
  );
}
