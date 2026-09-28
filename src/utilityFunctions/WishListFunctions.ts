import { wishlistWithItemsAndProducts ,productWithImages } from "@/types/RelationTypeInterface";
import { SupabaseClient } from "@supabase/supabase-js";

// Database wishlist functions
export const getOrCreateWishlist = async (userId: string, supabase: SupabaseClient) => {
    try {
        // Check if wishlist exists
        const { data: existingWishlist, error: fetchError } = await supabase
            .from("wishlist")
            .select("wishlist_id")
            .eq("user_id", userId)
            .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Error fetching wishlist:", fetchError);
            return { success: false, error: fetchError, wishlist_id: null };
        }

        if (existingWishlist && existingWishlist.wishlist_id) {
            return { success: true, wishlist_id: existingWishlist.wishlist_id };
        }

        // Create new wishlist
        const { data: newWishlist, error: createError } = await supabase
            .from("wishlist")
            .insert({ user_id: userId })
            .select("wishlist_id")
            .single();

        if (createError) {
            console.error("Error creating wishlist:", createError);
            return { success: false, error: createError, wishlist_id: null };
        }

        return { success: true, wishlist_id: newWishlist.wishlist_id };
    } catch (error) {
        console.error("Error in getOrCreateWishlist:", error);
        return { success: false, error: error, wishlist_id: null };
    }
};

export const addToDbWishlist = async (product: productWithImages, userId: string, supabase: SupabaseClient) => {
    try {
        // Get or create wishlist
        const wishlistResult = await getOrCreateWishlist(userId, supabase);
        if (!wishlistResult.success || !wishlistResult.wishlist_id) {
            console.error("Failed to get or create wishlist");
            return { success: false, error: wishlistResult.error };
        }

        const wishlistId = wishlistResult.wishlist_id;

        // Check if product already exists in wishlist_items
        const { data: existingItem, error: checkError } = await supabase
            .from("wishlist_items")
            .select("wishlist_item_id")
            .eq("wishlist_id", wishlistId)
            .eq("product_id", product.product_id)
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error("Error checking wishlist item:", checkError);
            return { success: false, error: checkError };
        }

        if (existingItem) {
            return { success: true, alreadyExists: true };
        }

        // Add to wishlist_items
        const { data, error } = await supabase
            .from("wishlist_items")
            .insert({
                wishlist_id: wishlistId,
                product_id: product.product_id,
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding to wishlist:", error);
            return { success: false, error: error };
        }

        return { success: true, data: data };
    } catch (error) {
        console.error("Error in addToDbWishlist:", error);
        return { success: false, error: error };
    }
};

export const removeFromDbWishlist = async (product: productWithImages, userId: string, supabase: SupabaseClient) => {
    try {
        // Get wishlist_id
        const { data: wishlist, error: wishlistError } = await supabase
            .from("wishlist")
            .select("wishlist_id")
            .eq("user_id", userId)
            .maybeSingle();

        if (wishlistError || !wishlist) {
            console.error("Error fetching wishlist:", wishlistError);
            return { success: false, error: wishlistError };
        }

        // Remove from wishlist_items
        const { error } = await supabase
            .from("wishlist_items")
            .delete()
            .eq("wishlist_id", wishlist.wishlist_id)
            .eq("product_id", product.product_id);

        if (error) {
            console.error("Error removing from wishlist:", error);
            return { success: false, error: error };
        }

        return { success: true };
    } catch (error) {
        console.error("Error in removeFromDbWishlist:", error);
        return { success: false, error: error };
    }
};

export const checkIfWishlisted = async (productId: string, userId: string, supabase: SupabaseClient) => {
    try {
        // Get wishlist_id
        const { data: wishlist, error: wishlistError } = await supabase
            .from("wishlist")
            .select("wishlist_id")
            .eq("user_id", userId)
            .maybeSingle();

        if (wishlistError || !wishlist) {
            return false;
        }

        // Check if product exists in wishlist_items
        const { data, error } = await supabase
            .from("wishlist_items")
            .select("wishlist_item_id")
            .eq("wishlist_id", wishlist.wishlist_id)
            .eq("product_id", productId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error("Error checking wishlist:", error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error("Error in checkIfWishlisted:", error);
        return false;
    }
};