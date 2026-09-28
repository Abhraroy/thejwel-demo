"use client";

import OptimizedImage from "@/components/OptimizedImage";
import { memo, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/zustandStore/zustandStore";
import { addToDbCart, addToLocalCart } from "@/utilityFunctions/CartFunctions";
import { createClient } from "@/lib/supabase-Utils/client";
import { Product } from "@/types/TypeInterface";
import {Send} from "lucide-react";

import { 
  
  addToDbWishlist,
  removeFromDbWishlist
} from "@/utilityFunctions/WishListFunctions";
import { toast } from "react-toastify";
import { getCartQuantityForProduct } from "@/utilityFunctions/CartFunctions";
import { shareProduct } from "@/utilityFunctions/ShareProduct";






interface ProductCardProps {
  product: any;
  onAddToCart?: (productId: string) => void;
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
  size?: 'small' | 'default';
  isLoading?: boolean;
}

function ProductCard({
  product,
  onAddToCart,
  onWishlistToggle,
  isWishlisted = false,
  size = 'default',
  isLoading = false,
}: ProductCardProps) {
  const [isWishlistActive, setIsWishlistActive] = useState(isWishlisted);
  const [isHovered, setIsHovered] = useState(false);
  const [isCartClicked, setIsCartClicked] = useState(false);
  const { cartItems, setCartItems, AuthenticatedState, AuthUserId, CartId, wishListItems, setWishListItems } = useStore();
  const supabase = createClient();

  const isWishlistedFromStore = useMemo(() => {
    if (!Array.isArray(wishListItems) || !product?.product_id) return false;
    return wishListItems.some((item: any) => {
      const pid = item?.product_id ?? item?.products?.product_id;
      return pid === product.product_id;
    });
  }, [wishListItems, product?.product_id]);

  useEffect(() => {
    setIsWishlistActive(Boolean(isWishlisted || isWishlistedFromStore));
  }, [isWishlisted, isWishlistedFromStore]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newWishlistState = !isWishlistActive;
    setIsWishlistActive(newWishlistState);
    onWishlistToggle?.(product.product_id);

    if (AuthenticatedState && AuthUserId) {
      // Use database functions for authenticated users
      if (newWishlistState) {
        // Add to wishlist
        const result = await addToDbWishlist(product, AuthUserId, supabase);
        if (!result.success) {
          // Revert state if failed
          setIsWishlistActive(!newWishlistState);
          console.error("Failed to add to wishlist:", result.error);
        } else {
          const exists = Array.isArray(wishListItems)
            ? wishListItems.some((item: any) => (item?.product_id ?? item?.products?.product_id) === product.product_id)
            : false;
          if (!exists) setWishListItems([...(wishListItems || []), product]);
        }
      } else {
        // Remove from wishlist
        const result = await removeFromDbWishlist(product, AuthUserId, supabase);
        if (!result.success) {
          // Revert state if failed
          setIsWishlistActive(!newWishlistState);
          console.error("Failed to remove from wishlist:", result.error);
        } else {
          setWishListItems(
            Array.isArray(wishListItems)
              ? wishListItems.filter(
                  (item: any) => (item?.product_id ?? item?.products?.product_id) !== product.product_id
                )
              : []
          );
        }
      }
    } else {
      // Use localStorage for unauthenticated users
      // if (newWishlistState) {
      //   const updatedWishList = addToLocalWishList(product);
      //   setWishListItems(updatedWishList);
      //   console.log("updatedWishList", updatedWishList);
      // } else {
      //   const updatedWishList = removeFromLocalWishList(product);
      //   setWishListItems(updatedWishList);
      //   console.log("removed from wishList", updatedWishList);
      // }
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const productId = product?.product_id;
    const availableStock = Number(product?.stock_quantity);
    const currentQtyInCart = getCartQuantityForProduct(cartItems, productId);

    if (Number.isFinite(availableStock)) {
      if (availableStock <= 0) {
        toast.error("This product is out of stock.", {
          style: { backgroundColor: "#2B241E", color: "#FFFDF8" },
          position: "top-right",
        });
        return;
      }
      if (currentQtyInCart >= availableStock) {
        toast.error(`Only ${availableStock} item(s) available in stock.`, {
          style: { backgroundColor: "#2B241E", color: "#FFFDF8" },
          position: "top-right",
        });
        return;
      }
    }

    setIsCartClicked(true);
    onAddToCart?.(product.product_id);
    if(AuthenticatedState){
      const updatedItem = await addToDbCart(product,CartId,supabase)
      if (Array.isArray(updatedItem)) {
        setCartItems(updatedItem);
      }
    }
    else{
      const updatedItem = addToLocalCart(product)
      setCartItems(updatedItem);
    }
    
    // Show success toast
    toast.success(`Item added to cart!`,{
      style:{
        backgroundColor:"#2B241E",
        color:"#FFFDF8",
      },
      position:"top-right"
    });
    
    // Reset animation after it completes
    setTimeout(() => {
      setIsCartClicked(false);
    }, 500);
  };

  const handleShareProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Sharing product");
    const result = await shareProduct(product);
    // if(result.success){
    //   toast.success("Product shared successfully", {
    //     style: { backgroundColor: "#eec0c8", color: "#360000" },
    //     position: "top-right"
    //   });
    // }
    // else{
    //   toast.error("Failed to share product", {
    //     style: { backgroundColor: "#eec0c8", color: "#360000" },
    //     position: "top-right"
    //   });
    // }
  };

  // Normalize price values to numbers to avoid string issues
  const basePrice = Number(product?.base_price) || 0;
  const finalPrice = Number(product?.final_price) || 0;
  const computedDiscount =
    basePrice > 0 && finalPrice < basePrice
      ? Math.round(((basePrice - finalPrice) / basePrice) * 100)
      : 0;
  const storedDiscount = Number(product?.discount_percentage);
  const hasStoredDiscount =
    Number.isFinite(storedDiscount) && storedDiscount > 0;
  const discountPercentage = Math.round(
    hasStoredDiscount ? storedDiscount : computedDiscount
  );
  const showBasePrice =
    basePrice > 0 && finalPrice >= 0 && basePrice !== finalPrice;

  const CardContent = (
    <div
      className="group relative bg-white rounded-xl md:rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full transform hover:-translate-y-1 "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container with Gradient Overlay */}
      <div className="relative w-full aspect-[2/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <OptimizedImage
          src={product.thumbnail_image ?? ""}
          alt={product.product_name}
          preset="card"
          fill
          className={`object-contain transition-all duration-700 ${
            isHovered ? " brightness-105" : "brightness-100"
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Gradient Overlay on Hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/0 via-black/0 to-black/0 transition-all duration-500 ${
            isHovered ? "via-black/5 to-black/10" : ""
          }`}
        />

        {/* Discount Badge - Redesigned */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110">
            <span className="flex items-center gap-0.5 md:gap-1">
              <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {discountPercentage}% OFF
            </span>
          </div>
        )}


        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 flex flex-col items-center justify-center  rounded-full w-fit h-fit px-2 py-1 gap-4">

        {/* Wishlist Button - Enhanced */}
        <button
          onClick={handleWishlistClick}
          className="w-8 h-8 md:w-10 md:h-10 text-sm md:text-base bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300
          "
          aria-label={
            isWishlistActive ? "Remove from wishlist" : "Add to wishlist"
          }

        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={isWishlistActive ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className={`w-4 h-4 md:w-5 md:h-5 ${
              isWishlistActive ? "text-[#360000] fill-theme-olive" : "text-[#360000]"
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>

        {/* Share button */}
        <button className="w-8 h-8 md:w-10 md:h-10 text-sm md:text-base bg-white/95 backdrop-blur-sm hover:bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300"
        aria-label="Share product"
        onClick={handleShareProduct}
        title="Share product"
        >
          <Send className="w-4 h-4 md:w-5 md:h-5 text-[#360000]" />
        </button>
        </div>


      </div>

      {/* Product Info */}
      <div className="p-3 md:p-5 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-sm md:text-lg font-semibold text-gray-900 truncate mb-2 md:mb-3 leading-tight group-hover:text-gray-700 transition-colors duration-300">
          {product.product_name}
        </h3>

        {/* Price Section - Enhanced */}
        <div className="border-t border-gray-100  ">
          <div className={`flex gap-2 ${size === 'small' ? 'mb-2 md:mb-3 flex-wrap md:flex-nowrap items-baseline md:items-baseline' : 'mb-3 md:mb-4 items-baseline'}`}>
            <div className="flex items-baseline gap-1.5 md:gap-2 flex-wrap md:flex-nowrap">
              <span className={`font-bold text-gray-900 tracking-tight ${
                size === 'small' 
                  ? 'text-sm md:text-lg' 
                  : 'text-lg md:text-2xl'
              }`}>
                ₹{finalPrice.toFixed(2)}
              </span>
              {showBasePrice && (
                <span className={`text-gray-400 line-through font-medium whitespace-nowrap ${
                  size === 'small' 
                    ? 'text-[10px] md:text-sm' 
                    : 'text-xs md:text-base'
                }`}>
                  ₹{basePrice.toFixed(2)}
                </span>
              )}
            </div>
            {showBasePrice && (
              <span className={`font-semibold text-[#360000] bg-theme-sage/20 rounded whitespace-nowrap ${
                size === 'small' 
                  ? 'text-[9px] md:text-xs px-1.5 py-0.5' 
                  : 'text-[10px] md:text-sm px-1.5 md:px-2 py-0.5'
              }`}>
                Save ₹{(basePrice - finalPrice).toFixed(2)}
              </span>
            )}
          </div>

          {/* Action Button - Redesigned */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-2.5 md:py-3 px-3 md:px-4 rounded-lg md:rounded-xl transition-all duration-300 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-theme-olive hover:shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 md:gap-2 group/btn text-sm md:text-base"
          >
            <span className="transition-transform duration-300 group-hover/btn:translate-x-0.5">
              Add to Cart 
            </span>
            <svg
              className={`w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 origin-center ${
                isCartClicked ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="group relative bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full animate-pulse">
        <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-gray-50 to-gray-100" />
        <div className="p-3 md:p-5 flex flex-col flex-grow gap-3 md:gap-4">
          <div className="space-y-2">
            <div className="h-4 md:h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-3 md:h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="mt-auto pt-2 md:pt-3 border-t border-gray-100 space-y-3">
            <div className="flex gap-2 items-center">
              <div className="h-6 md:h-8 bg-gray-200 rounded w-24" />
              <div className="h-4 md:h-5 bg-gray-200 rounded w-16" />
              <div className="h-4 md:h-5 bg-gray-200 rounded w-14" />
            </div>
            <div className="h-10 md:h-12 bg-gray-200 rounded-lg md:rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (product.product_id) {
    return (
      <Link
        href={`/product/${product.product_id}`}
        className="block h-full"
        onClick={() => {
          if (process.env.NEXT_PUBLIC_NAV_PERF_DEBUG === "true") {
            performance.mark("nav-product-start");
          }
        }}
      >
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}

export default memo(ProductCard);
