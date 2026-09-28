'use client';

import OptimizedImage from "@/components/OptimizedImage";
import { useRouter } from "next/navigation";
import { useStore } from "@/zustandStore/zustandStore";
import type { AnyCartItem } from "@/types/CartTypes";

interface CartItemProps {
  item: AnyCartItem;
  onDecrease: (item: AnyCartItem) => void;
  onIncrease: (item: AnyCartItem) => void;
  onRemove: (item: AnyCartItem) => void;
}

export default function CartItem({
  item,
  onDecrease,
  onIncrease,
  onRemove,
}: CartItemProps) {
  const router = useRouter();
  const { setIsCartOpen } = useStore();
  const product = (item as any)?.products ?? undefined;
  const productName = product?.product_name || (product as any)?.name || "Product";
  const productImage = product?.thumbnail_image || (product as any)?.image_url || null;
  const price = Number(product?.final_price ?? (product as any)?.price ?? 0);
  const quantity = Number(item?.quantity ?? 1);
  const productSlugOrId = (product as any)?.slug || product?.product_id || (product as any)?.id;

  const handleNavigate = () => {
    if (productSlugOrId) {
      setIsCartOpen(false);
      router.push(`/product/${productSlugOrId}`);
    }
  };

  return (
    <div
      className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-black/10 text-[#360000] rounded-xl hover:bg-black/15 transition-colors duration-200 cursor-pointer"
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNavigate();
        }
      }}
    >
      {/* Product Image */}
      <div className="relative w-30 h-30 sm:w-30 sm:h-30 md:w-30 md:h-30 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-[#7A1C1C]/20">
        <OptimizedImage
          src={productImage ?? ""}
          alt={productName}
          preset="thumbnail"
          fill
          objectFit="cover"
          className="cursor-pointer"
          sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="text-base font-semibold text-[#360000] line-clamp-2 mb-1 flex-shrink-0 font-open-sans-sans tracking-wider">
          {productName}
        </h3>
        <p className="text-base sm:text-lg font-bold text-[#360000] mb-2 sm:mb-3 flex-shrink-0 font-open-sans tracking-wider">
          ₹{price}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 sm:gap-3 mt-auto">
          <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 border border-[#7A1C1C]/30 rounded-full bg-white">
            <button
              className="p-1.5 sm:p-2 text-[#7A1C1C] bg-transparent rounded-full transition-all duration-200 flex-shrink-0 hover:shadow-[0_0_12px_rgba(122,28,28,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FD7979]/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={quantity === 1}
              aria-label="Decrease quantity"
              onClick={(e) => {
                e.stopPropagation();
                onDecrease(item);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            </button>
            <span className="px-1 sm:px-2 text-xs sm:text-sm font-semibold text-[#7A1C1C] min-w-[1.5rem] sm:min-w-[2rem] text-center tabular-nums flex-shrink-0">
              {quantity}
            </span>
            <button
              className="p-1.5 sm:p-2 text-[#7A1C1C] bg-transparent rounded-full transition-all duration-200 flex-shrink-0 hover:shadow-[0_0_12px_rgba(122,28,28,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FD7979]/60 cursor-pointer"
              aria-label="Increase quantity"
              onClick={(e) => {
                e.stopPropagation();
                onIncrease(item);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          {/* Remove Button */}
          <button
            className="p-1 sm:p-1.5 text-[#360000] hover:text-[#360000] hover:scale-105 rounded-full transition-scale duration-200 shrink-0 cursor-pointer"
            aria-label="Remove item"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

