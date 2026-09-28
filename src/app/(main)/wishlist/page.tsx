"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-Utils/client";
import { useStore } from "@/zustandStore/zustandStore";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductUI/ProductCard";
import { addToDbCart, addToLocalCart } from "@/utilityFunctions/CartFunctions";

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const {
    AuthenticatedState,
    setMobnoInputState,
    AuthUserId,
    CartId,
    setCartItems,
    setWishListItems,
  } = useStore();

  // Check authentication and fetch user data
  useEffect(() => {
    const checkAuthAndFetchWishlist = async () => {
      // First check if there's an active session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        setLoading(false);
        return;
      }
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get user data from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_id")
        .eq("phone_number", "+" + user.phone)
        .single();

      if (userData) {
        setUserId(userData.user_id);
        await fetchWishlistIdAndItems(userData.user_id);
      } else {
        setLoading(false);
      }
    };

    checkAuthAndFetchWishlist();
  }, [AuthenticatedState]);

  // First get wishlist_id from wishlist table, then fetch items from wishlist_items
  const fetchWishlistIdAndItems = async (user_id: string) => {
    try {
      // Step 1: Get wishlist_id from wishlist table
      const { data: wishlistData, error: wishlistError } = await supabase
        .from("wishlist")
        .select("wishlist_id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (wishlistError) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      if (!wishlistData || !wishlistData.wishlist_id) {
        // No wishlist exists for this user
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      setWishlistId(wishlistData.wishlist_id);

      // Step 2: Fetch wishlist items using wishlist_id
      await fetchWishlistItems(wishlistData.wishlist_id);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setWishlistItems([]);
      setLoading(false);
    }
  };

  // Fetch wishlist items with product details from wishlist_items table
  const fetchWishlistItems = async (wishlist_id: string) => {
    try {
      // First, try to fetch with relationship
      const { data, error } = await supabase
        .from("wishlist_items")
        .select(
          `
          *,
          products (
            *,
            product_images (*)
          )
        `
        )
        .eq("wishlist_id", wishlist_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching wishlist items:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        // Fallback: Try fetching without relationship and then fetch products separately
        const { data: itemsData, error: itemsError } = await supabase
          .from("wishlist_items")
          .select("*")
          .eq("wishlist_id", wishlist_id)
          .order("created_at", { ascending: false });

        if (itemsError) {
          console.error("Error fetching wishlist items (fallback):", itemsError);
          setWishlistItems([]);
          setLoading(false);
          return;
        }

        if (!itemsData || itemsData.length === 0) {
          setWishlistItems([]);
          setLoading(false);
          return;
        }

        // Fetch products separately
        const productIds = itemsData.map((item: any) => item.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select(`
            *,
            product_images (*)
          `)
          .in("product_id", productIds);

        if (productsError) {
          console.error("Error fetching products:", productsError);
          setWishlistItems([]);
          setLoading(false);
          return;
        }

        // Combine wishlist_items with products
        const productMap = new Map(productsData?.map((p: any) => [p.product_id, p]) || []);
        const formattedItems = itemsData
          .map((item: any) => {
            const product = productMap.get(item.product_id);
            if (!product) return null;
            return {
              ...product,
              wishlist_item_id: item.wishlist_item_id || item.id,
              wishlist_id: item.wishlist_id,
              added_at: item.added_at,
            };
          })
          .filter((item: any) => item !== null);

        setWishlistItems(formattedItems);
        setWishListItems(formattedItems);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      // Transform data to match ProductCard format
      const formattedItems = data
        .filter((item: any) => item.products !== null && item.products !== undefined) // Filter out items where product is null
        .map((item: any) => ({
          ...item.products,
          wishlist_item_id: item.wishlist_item_id || item.id,
          wishlist_id: item.wishlist_id,
          added_at: item.added_at,
        }));
      
      setWishlistItems(formattedItems);
      setWishListItems(formattedItems);
    } catch (error) {
      console.error("Error fetching wishlist items:", error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (product: any) => {
    if (!wishlistId || !product.wishlist_item_id) return;

    try {
      // Remove from wishlist_items table
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("wishlist_item_id", product.wishlist_item_id)
        .eq("wishlist_id", wishlistId);

      if (error) {
        console.error("Error removing from wishlist:", error);
      } else {
        // Update local state
        setWishlistItems((prev) =>
          prev.filter(
            (item) => item.wishlist_item_id !== product.wishlist_item_id
          )
        );
        // Also update zustand store
        setWishListItems(
          wishlistItems.filter(
            (item) => item.wishlist_item_id !== product.wishlist_item_id
          )
        );
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  // Handle add to cart
  const handleAddToCart = async (product: any) => {
    if (AuthenticatedState && CartId) {
      const updatedItem = await addToDbCart(product, CartId, supabase);
      if (Array.isArray(updatedItem)) {
        setCartItems(updatedItem);
      }
    } else {
      const updatedItem = addToLocalCart(product);
      setCartItems(updatedItem);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async (productId: string) => {
    const product = wishlistItems.find(
      (item) => item.product_id === productId
    );
    if (product) {
      await handleRemoveFromWishlist(product);
    }
  };

  // Handle login redirect
  const handleLogin = () => {
    setMobnoInputState();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-cream">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-60 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductCard key={idx} product={{}} isLoading />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Not authenticated - show login message
  if (!AuthenticatedState || !userId) {
    return (
      <div className="min-h-screen bg-theme-cream">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 bg-theme-sage/20 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 text-[#360000]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Please Log In to View Wishlist
            </h1>
            <p className="text-gray-600 mb-8 max-w-md">
              Sign in to your account to see your saved wishlist items and
              continue shopping.
            </p>
            <button
              onClick={handleLogin}
              className="px-8 py-3 bg-linear-to-r from-pink-500 to-red-500 hover:opacity-95 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Log In
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated - show wishlist
  return (
    <div className="min-h-screen bg-theme-cream">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            My Wishlist
          </h1>
          <p className="text-gray-600">
            {wishlistItems.length > 0
              ? `${wishlistItems.length} item${wishlistItems.length > 1 ? "s" : ""} saved`
              : "Your saved items will appear here"}
          </p>
        </div>

        {/* Wishlist Items Grid */}
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {wishlistItems.map((product) => (
              <ProductCard
                key={product.product_id || product.wishlist_item_id}
                product={product}
                onAddToCart={handleAddToCart}
                onWishlistToggle={handleWishlistToggle}
                isWishlisted={true}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <div className="w-24 h-24 bg-black/10 rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 text-[#360000]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Start adding items to your wishlist by clicking the heart icon on
              any product.
            </p>
            <a
              href="/"
              className="px-8 py-3 bg-linear-to-r from-pink-500 to-red-500 hover:opacity-95 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Continue Shopping
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

