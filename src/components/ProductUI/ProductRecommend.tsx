import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import OptimizedImage from "../OptimizedImage";

type Product = {
  product_id: string | number;
  product_name?: string;
  base_price?: number | string;
  final_price?: number | string;
  thumbnail_image?: string;
  discount_percentage?: number | string;
};

const SCROLL_STEP = 256;
const SCROLL_TOLERANCE = 1;

export default function ProductRecommended({
  products,
  productId,
}: {
  products: Product[];
  productId: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  return (
    <div className=" p-2 flex items-center justify-center">
      <div className="w-full max-h-fit md:w-2/3 lg:w-2/3 px-6 py-6 flex flex-col overflow-hidden shrink-0 gap-4 border shadow-md rounded-md
      " >
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Recommended Products</h2>
            <Link href={`/product/${productId}/recommended`} className="text-xs text-[#360000] hover:text-[#360000]/80">View All</Link>
        </div>
        <div className="relative flex gap-4 max-w-full items-center">
        <div className={`hidden lg:flex w-fit h-fit cursor-pointer ${canScrollLeft ? "opacity-100" : "opacity-50 cursor-not-allowed"}`} onClick={() => handleScroll("left")}><ChevronLeft className="w-10 h-10 text-black" /></div>
            <div className="flex-1 flex min-w-0 overflow-x-auto gap-4 items-center w-full scrollbar-hide " ref={scrollRef} onScroll={updateScrollButtons}>
                {
                   products.map((product) => (
                   <Link key={product.product_id} href={`/product/${product.product_id}`} className="shrink-0 w-60 h-fit rounded-md flex flex-col relative justify-start">
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
                        <span className="text-[1rem] text-black font-bold">{product.discount_percentage}% OFF</span>
                        <p className="flex gap-1 items-center">
                            <span className="text-[0.9rem] text-gray-500 line-through">₹{product.base_price}</span>
                        
                            <span className="text-[1.1rem] text-black font-bold">{product.final_price}</span>
                        </p>
                    </div>
                   </Link>
                   ))
                }
            </div>
            <div className={`hidden lg:flex w-fit h-fit cursor-pointer ${canScrollRight ? "opacity-100" : "opacity-50 cursor-not-allowed"}`} onClick={() => handleScroll("right")}><ChevronRight className="w-10 h-10 text-black" /></div>
        </div>
      </div>
    </div>
  );
}
