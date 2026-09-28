"use client";

import { useStore } from "@/zustandStore/zustandStore";
import { useEffect, useState } from "react";
import { useBodyScrollLock } from "@/lib/body-scroll-lock";
import { createClient } from "@/lib/supabase-Utils/client";
import { addToDbCart, addToLocalCart, decreaseQuantityFromDbCart, decreaseQuantityFromLocalCart, getCartData, removeFromDbCart, removeFromLocalCart, getCartQuantityForProduct } from "@/utilityFunctions/CartFunctions";
import CartItem from "./CartItem";
import { toast } from "react-toastify";
import type { AnyCart, AnyCartItem, DbCartItem, LocalCartItem, LocalCart } from "@/types/CartTypes";
import { isDbCartItem, isLocalCartItem } from "@/types/CartTypes";
import { Truck, PartyPopper, Check } from "lucide-react";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  SHIPPING_ENABLED,
  getShippingCost,
} from "@/lib/shipping-config";

interface CartProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Cart({ isOpen = false, onClose }: CartProps) {
  const { AuthenticatedState, cartItems, setCartItems, CartId, setInitiatingCheckout, initiatingCheckout } = useStore();
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const shippingCost = getShippingCost(subtotal);
  const displayTotal = subtotal + shippingCost;
  const isFreeShippingUnlocked =
    !SHIPPING_ENABLED || subtotal >= FREE_SHIPPING_THRESHOLD;
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const amountLeftForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  // Sample cart items for UI demonstration
  const supabase = createClient();

  const calculateSubTotal = (items: AnyCart) => {
    if (!Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((sum: number, item: any) => {
      const product = item?.products ?? item?.product ?? item;
      const price = Number(product?.final_price ?? product?.price ?? 0);
      const quantity = Number(item?.quantity ?? 1);
      return sum + price * quantity;
    }, 0);
  };

  const handleDecreaseQuantity = async(item: AnyCartItem)=>{
    if(AuthenticatedState){
      if (!isDbCartItem(item)) return;
       const updatedItem = await decreaseQuantityFromDbCart(item as DbCartItem,CartId,supabase)
        if (Array.isArray(updatedItem)) setCartItems(updatedItem);
    }
    else{
      if (!isLocalCartItem(item)) return;
      const updatedItem = await decreaseQuantityFromLocalCart(item as LocalCartItem)
      setCartItems(updatedItem);
    }
  }

  const handleRemoveItem = async(item: AnyCartItem)=>{
    if(AuthenticatedState){
      if (!isDbCartItem(item)) return;
      const updatedItem = await removeFromDbCart(item as DbCartItem,CartId,supabase)
      if (Array.isArray(updatedItem)) setCartItems(updatedItem);
    }
    else{
      if (!isLocalCartItem(item)) return;
      const updatedItem = await removeFromLocalCart(item as LocalCartItem)
      setCartItems(updatedItem);
    }
  }
  
  const handleIncreaseQuantity = async(item: AnyCartItem)=>{
    // Stock guard for incrementing quantity inside cart
    const productObj = (item as any)?.products ?? item;
    const productId = isDbCartItem(item) ? item.product_id : (productObj as any)?.product_id;
    const requiredNextQty = getCartQuantityForProduct(cartItems, productId) + 1;
    if (productId) {
      const latestStockRes = await supabase
        .from("products")
        .select("stock_quantity, product_name")
        .eq("product_id", productId)
        .single();
      if (!latestStockRes.error) {
        const availableStock = Number(latestStockRes.data?.stock_quantity);
        if (Number.isFinite(availableStock) && requiredNextQty > availableStock) {
          toast.error(
            `${latestStockRes.data?.product_name || "This product"} has only ${availableStock} item(s) in stock.`,
            { style: { backgroundColor: "#eec0c8", color: "#360000" }, position: "top-right" }
          );
          return;
        }
      }
    }

    if(AuthenticatedState){
      if (!isDbCartItem(item)) return;
      const payload = item.products ?? { product_id: productId as string };
      const updatedItem = await addToDbCart(payload,CartId,supabase)
      if (Array.isArray(updatedItem)) setCartItems(updatedItem);
    }
    else{
      if (!isLocalCartItem(item)) return;
      const updatedItem = addToLocalCart(item.products as any)
      setCartItems(updatedItem);
    }
  }

  useEffect(() => {
    if(cartItems){
      setSubtotal(calculateSubTotal(cartItems));
    }
    else{
      setSubtotal(0);
    }
  }, [cartItems]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    const getCartItems = async () => {
      setLoading(true);
      if (!AuthenticatedState) {
        const localCartItems = localStorage.getItem("cartItems");
        const tempCartItems: LocalCart = localCartItems ? JSON.parse(localCartItems) : [];
        setCartItems(tempCartItems);
        setLoading(false);
      } else if (AuthenticatedState && CartId) {
        const { success, data, message } = await getCartData(CartId, supabase);
        if (success && data) {
          setCartItems(data);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    getCartItems();
  }, [AuthenticatedState, CartId]);

  return (
    <>
      {/* Backdrop — always mounted; opacity toggles with isOpen to avoid mount delay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-60 transition-opacity duration-50 ease-in-out touch-none overscroll-none ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Cart Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[100vw] sm:w-96 md:w-[420px] lg:w-[480px] bg-[#FAF9F6] text-white shadow-2xl z-70 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-white/20  sticky top-0 z-10">
            <h2 className="text-2xl sm:text-xl md:text-2xl text-[#360000] font-josefin-sans-extrabold tracking-normal">
              Shopping Cart
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[#360000] hover:text-[#360000]/80 hover:scale-125 rounded-full transition-all duration-200 ease-in-out  cursor-pointer"
              aria-label="Close cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-3 sm:py-4 px-3 sm:px-4 md:px-6 scrollbar-hide
          ">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 sm:gap-4 bg-white/10 rounded-lg p-3 sm:p-4 animate-pulse"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/20 rounded w-3/4" />
                      <div className="h-3 bg-white/20 rounded w-1/2" />
                      <div className="h-3 bg-white/20 rounded w-1/3" />
                    </div>
                    <div className="w-12 h-10 bg-white/20 rounded" />
                  </div>
                ))}
              </div>
            ) : cartItems && cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 sm:py-12 px-4   text-white">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="#7A1C1C"
                    className="w-10 h-10 sm:w-12 sm:h-12"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.4 2.924-6.375a48.567 48.567 0 0 0-8.563-4.137M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#360000] font-open-sans tracking-wider mb-2">
                  Your cart is empty
                </h3>
                <p className="text-[#360000]/80 text-xs sm:text-sm mb-4 sm:mb-6 font-open-sans tracking-wider">
                  Looks like you haven't added anything to your cart yet.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#FFCDC9] text-[#7A1C1C] font-medium rounded-lg hover:bg-[#FD7979] transition-colors duration-200 text-sm sm:text-base"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4  ">
                {cartItems &&
                  cartItems.map((item: AnyCartItem) => {
                    // Use stable unique key - cart_item_id for DB items, product_id for local items
                    const product = (item as any)?.products ?? item;
                    const dbCartItemId = isDbCartItem(item) ? item.cart_item_id : undefined;
                    const dbProductId = isDbCartItem(item) ? item.product_id : undefined;
                    const uniqueKey =
                      dbCartItemId ||
                      (product as any)?.product_id ||
                      dbProductId ||
                      `cart-item-${(product as any)?.product_id || "unknown"}`;

                    return (
                      <CartItem
                        key={uniqueKey}
                        item={item}
                        onDecrease={handleDecreaseQuantity}
                        onIncrease={handleIncreaseQuantity}
                        onRemove={handleRemoveItem}
                      />
                    );
                  })}
              </div>
            )}
          </div>

          {/* Cart Footer - Summary & Checkout */}
          {cartItems && cartItems.length > 0 && (
            <div className="border-t border-white/20  text-[#7A1C1C] p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 sticky bottom-0">
              {/* shipping charge,cod information,tax information,etc. */}
              <div className="space-y-2.5 sm:space-y-3 border-1 border-black p-3 sm:p-4 flex flex-col rounded-lg w-full">
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2 text-[#360000] font-open-sans tracking-wider flex-1 min-w-0">
                    {isFreeShippingUnlocked && (
                      <PartyPopper className="w-5 h-5 shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm font-semibold">
                      {isFreeShippingUnlocked
                        ? "Congratulations! You've unlocked FREE shipping!"
                        : `Add ₹${amountLeftForFreeShipping} more to get free shipping on cash on delivery`}
                    </span>
                  </div>
                  <Truck className="w-5 h-5 text-[#360000] shrink-0" />
                </div>

                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex-1 h-2.5 bg-[#360000]/15 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#360000] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                      isFreeShippingUnlocked
                        ? "bg-[#360000] border-[#360000] text-white"
                        : "bg-transparent border-[#360000]/25 text-[#360000]/30"
                    }`}
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full mt-1 px-4 py-2.5 font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 rounded-xl transition-all hover:shadow-md active:scale-[0.98] hover:cursor-pointer text-sm font-open-sans tracking-wider"
                >
                  Continue Shopping
                </button>
              </div>
              {/* Price Summary */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-[#360000] font-extrabold font-open-sans tracking-wider">Shipping</span>
                  {isFreeShippingUnlocked ? (
                    <span className="font-medium font-open-sans tracking-wider flex items-center gap-2">
                      <span className="text-[#360000]/50 line-through">₹{SHIPPING_FEE.toFixed(2)}</span>
                      <span className="text-green-700 font-semibold">FREE</span>
                    </span>
                  ) : (
                    <span className="font-medium text-[#360000] font-open-sans tracking-wider">
                      ₹{shippingCost.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-2 sm:pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm sm:text-base font-semibold text-[#360000] font-open-sans tracking-wider">
                      Total
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-[#360000] font-open-sans tracking-wider">
                      ₹{displayTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <button 
                className="w-full bg-linear-to-r from-pink-500 to-red-500 text-white font-bold py-2.5 sm:py-3 md:py-3.5 px-4 sm:px-6 rounded-xl hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm sm:text-base font-open-sans tracking-wider"
                onClick={async ()=>{
                  // Before checkout, validate latest stock for all cart items.
                  try {
                    const items = Array.isArray(cartItems) ? cartItems : [];
                    const qtyByProductId = new Map<string, { qty: number; name?: string }>();
                    for (const item of items) {
                      const product = ("products" in item ? item.products : undefined) ?? item;
                      const pid =
                        (product as any)?.product_id ?? ("product_id" in item ? item.product_id : undefined);
                      const qty = Number(item?.quantity ?? 1) || 0;
                      if (!pid || qty <= 0) continue;
                      const prev = qtyByProductId.get(pid);
                      qtyByProductId.set(pid, { qty: (prev?.qty || 0) + qty, name: (product as any)?.product_name });
                    }

                    const productIds = Array.from(qtyByProductId.keys());
                    if (productIds.length === 0) {
                      toast.error("Your cart is empty.", { style: { backgroundColor: "#2B241E", color: "#FFFDF8" }, position: "top-right" });
                      return;
                    }

                    const stockRes = await supabase
                      .from("products")
                      .select("product_id, product_name, stock_quantity")
                      .in("product_id", productIds);

                    if (stockRes.error) {
                      toast.error("Could not validate stock. Please try again.", { style: { backgroundColor: "#2B241E", color: "#FFFDF8" }, position: "top-right" });
                      return;
                    }

                    const stockMap = new Map<string, { stock: number; name: string }>();
                    for (const row of stockRes.data || []) {
                      stockMap.set(row.product_id, {
                        stock: Number(row.stock_quantity) || 0,
                        name: row.product_name || "Product",
                      });
                    }

                    const issues: string[] = [];
                    for (const [pid, info] of qtyByProductId.entries()) {
                      const db = stockMap.get(pid);
                      const name = db?.name || info.name || "Product";
                      const stock = db?.stock ?? 0;
                      if (stock <= 0) {
                        issues.push(`${name} is out of stock`);
                      } else if (info.qty > stock) {
                        issues.push(`${name} || has only ${stock} left (you have ${info.qty} in cart)`);
                      }
                    }

                    if (issues.length > 0) {
                      toast.error(issues.join(". "), { style: { backgroundColor: "#2B241E", color: "#FFFDF8" }, position: "top-right" });
                      return;
                    }

                    setInitiatingCheckout(true);
                    onClose?.(); // Close the cart sidebar
                  } catch (e) {
                    console.error("Checkout stock validation failed:", e);
                    toast.error("Could not validate stock. Please try again.", { style: { backgroundColor: "#2B241E", color: "#FFFDF8" }, position: "top-right" });
                  }
                }}
                disabled={initiatingCheckout}
              >
                {initiatingCheckout ? "Proceeding to checkout..." : "Proceed to Checkout"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
