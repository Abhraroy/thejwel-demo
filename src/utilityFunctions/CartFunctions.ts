import type {
  AnyCart,
  CartProduct,
  DbCart,
  DbCartItem,
  LocalCart,
  LocalCartItem,
} from "@/types/CartTypes";
import { SupabaseClient } from "@supabase/supabase-js";
import { trackAddToCart } from "@/lib/meta/pixel";

export const addToLocalCart = (product: CartProduct): LocalCart => {
    let cartMap = new Map<string, LocalCartItem>();
    const product_obj: CartProduct = { ...product };
    
    const localCartItems = localStorage.getItem('cartItems')
    let localCartItemsArray: LocalCart = localCartItems ? JSON.parse(localCartItems) : [];
    if(localCartItemsArray.length === 0){
        cartMap.set(product_obj.product_id,{products:product_obj,quantity:1})
    }
    else{
        localCartItemsArray.forEach((item: LocalCartItem) => {
            cartMap.set(item.products.product_id, item)
        })
        if(cartMap.has(product_obj.product_id)){
            const existing = cartMap.get(product_obj.product_id);
            if (existing) existing.quantity += 1;
        }
        else{
            cartMap.set(product_obj.product_id, {products:product_obj,quantity:1})
        }
    }
    const updatedCart: LocalCart = Array.from(cartMap.values())
    localStorage.setItem("cartItems",JSON.stringify(updatedCart))
    fireAddToCartEvent(product_obj, 1);
    return updatedCart;
}


export const removeFromLocalCart = (
  itemOrProduct: LocalCartItem | CartProduct
): LocalCart => {
    let cartMap = new Map<string, LocalCartItem>();
    const localCartItems = localStorage.getItem('cartItems')
    let localCartItemsArray: LocalCart = localCartItems ? JSON.parse(localCartItems) : [];
    if(localCartItemsArray.length === 0){
        return localCartItemsArray;
    }
    else{
        // Get the product_id from the item structure
        // item can be {products: {...}, quantity: 1} or the product itself
        const productToRemove = (itemOrProduct as any)?.products ?? (itemOrProduct as any)?.product ?? itemOrProduct;
        const productIdToRemove = (productToRemove as any)?.product_id ?? (itemOrProduct as any)?.product_id;
        
        if(!productIdToRemove){
            return localCartItemsArray;
        }
        
        localCartItemsArray.forEach((item: LocalCartItem) => {
            const itemProductId = item?.products?.product_id;
            if(itemProductId){
                cartMap.set(itemProductId, item)
            }
        })
        
        if(cartMap.has(productIdToRemove)){
            cartMap.delete(productIdToRemove)
        }
    }
    localStorage.setItem("cartItems",JSON.stringify(Array.from(cartMap.values())))
    return Array.from(cartMap.values())
}

export const decreaseQuantityFromLocalCart = (
  itemOrProduct: LocalCartItem | CartProduct
): LocalCart => {
    let cartMap = new Map<string, LocalCartItem>();
    const localCartItems = localStorage.getItem('cartItems')
    let localCartItemsArray: LocalCart = localCartItems ? JSON.parse(localCartItems) : [];
    if(localCartItemsArray.length === 0){
        return localCartItemsArray;
    }
    else{
        // Get the product_id from the item structure
        // item can be {products: {...}, quantity: 1} or the product itself
        const productToDecrease = (itemOrProduct as any)?.products ?? (itemOrProduct as any)?.product ?? itemOrProduct;
        const productIdToDecrease = (productToDecrease as any)?.product_id ?? (itemOrProduct as any)?.product_id;
        
        if(!productIdToDecrease){
            return localCartItemsArray;
        }
        
        localCartItemsArray.forEach((item: LocalCartItem) => {
            const itemProductId = item?.products?.product_id;
            if(itemProductId){
                cartMap.set(itemProductId, item)
            }
        })
        
        if(cartMap.has(productIdToDecrease)){
            const itemToUpdate = cartMap.get(productIdToDecrease);
            if(itemToUpdate && itemToUpdate.quantity > 1){
                itemToUpdate.quantity -= 1;
                cartMap.set(productIdToDecrease, itemToUpdate);
            }
            else{
                return localCartItemsArray;
            }
        }
        else{
            return localCartItemsArray;
        }
    }
    localStorage.setItem("cartItems",JSON.stringify(Array.from(cartMap.values())))
    return Array.from(cartMap.values())
}


export const createCart = async(AuthUserId:string,supabase:SupabaseClient)=>{
    const {data,error} = await supabase.from("cart").insert({
        user_id:AuthUserId,
    }).select().single();
    if(error){
        return {success:false,error:error,message:"Failed to create cart"}
    }
    else{
        return {success:true,data:data,message:"Cart created successfully"}
    }
}


export const getCartData = async (CartId: string, supabase: SupabaseClient) => {
    const {data,error} = await supabase
    .from("cart_items")
    .select(`
        *,
    cart(*),
    products(*)
    `)
    .eq("cart_id",CartId)
    // Ensure stable ordering so UI list doesn't reorder on quantity updates
    .order("cart_item_id", { ascending: true })
    if(error){
        return {success:false,data:null,message:error.message}
    }
    else{
        return {success:true,data:(data as DbCart),message:"Cart data fetched successfully"}
    }
}












export type DbCartOpError = { success: false; error: unknown; message: string };
export type DbCartOpResult = DbCart | DbCartOpError;

type DbCartProductRef = { product_id: string };

const getProductIdFromInput = (input: DbCartItem | LocalCartItem | CartProduct | DbCartProductRef): string | null => {
  const fromItem = (input as any)?.product_id;
  if (typeof fromItem === "string" && fromItem) return fromItem;
  const fromLocal = (input as any)?.products?.product_id;
  if (typeof fromLocal === "string" && fromLocal) return fromLocal;
  const fromProduct = (input as any)?.product?.product_id;
  if (typeof fromProduct === "string" && fromProduct) return fromProduct;
  const fromPlain = (input as any)?.product_id;
  if (typeof fromPlain === "string" && fromPlain) return fromPlain;
  return null;
};

function productUnitPrice(product: CartProduct | DbCartProductRef | null | undefined): number {
  const p = product as any;
  const nested = p?.products ?? p?.product ?? p;
  const price = Number(nested?.final_price ?? nested?.base_price ?? p?.final_price ?? p?.base_price ?? 0);
  return Number.isFinite(price) ? price : 0;
}

function fireAddToCartEvent(
  product: CartProduct | DbCartProductRef,
  quantity = 1
): void {
  const pid = getProductIdFromInput(product as any);
  if (!pid) return;
  const unit = productUnitPrice(product);
  trackAddToCart({
    contentIds: [pid],
    value: unit * Math.max(1, quantity),
    currency: "INR",
    numItems: Math.max(1, quantity),
  });
}

export const addToDbCart = async (
  product: CartProduct | DbCartProductRef,
  CartId: string,
  supabase: SupabaseClient
): Promise<DbCartOpResult> => {
    const pid = getProductIdFromInput(product as any);
    if (!pid) {
        return { success: false, error: null, message: "Missing product_id" };
    }
    const productExistsInCart = await supabase.from("cart_items").select("*").eq("cart_id",CartId).eq("product_id",pid)
    if(productExistsInCart.data && productExistsInCart.data.length > 0){
        const {data,error} = await supabase.from("cart_items").update({
            quantity:productExistsInCart.data[0].quantity + 1,
        }).eq("cart_id",CartId).eq("product_id",pid)
        if(error){
            return {success:false,error:error,message:"Failed to update cart item"}
        }
        else{
            const updatedCartItems = await getCartData(CartId,supabase)
            if(updatedCartItems.success){
                fireAddToCartEvent(product, 1);
                return updatedCartItems.data as DbCart;
            }
            return { success: false, error: null, message: "Failed to get cart data" };
        }
    }
    else{
        const {data,error} = await supabase.from("cart_items").insert({
            cart_id:CartId,
            product_id:pid,
            quantity:1,
        })
        if(error){
            return {success:false,error:error,message:"Failed to add to cart"}
        }
        else{
            const updatedCartItems = await getCartData(CartId,supabase)
            if(updatedCartItems.success){
                fireAddToCartEvent(product, 1);
                return updatedCartItems.data as DbCart;
            }
            return { success: false, error: null, message: "Failed to get cart data" };
        }
    }
    
}

/**
 * Returns the current quantity of a product in the cart (works for both DB cart item shape and local cart item shape)
 */
export const getCartQuantityForProduct = (
  cartItems: AnyCart | null | undefined,
  productId: string
): number => {
  if (!Array.isArray(cartItems) || !productId) return 0;
  let qty = 0;
  for (const item of cartItems) {
    // DB cart item: has cart_id + product_id on the item itself
    if ((item as any)?.cart_id) {
      if ((item as DbCartItem).product_id === productId) {
        qty += Number((item as DbCartItem).quantity ?? 1) || 0;
      }
      continue;
    }

    // Local cart item: product_id lives on item.products
    const local = item as LocalCartItem;
    if (local?.products?.product_id === productId) {
      qty += Number(local?.quantity ?? 1) || 0;
    }
  }
  return qty;
};


export const removeFromDbCart = async (
  itemOrProduct: DbCartItem | CartProduct,
  CartId: string,
  supabase: SupabaseClient
): Promise<DbCartOpResult> => {
    const pid = getProductIdFromInput(itemOrProduct as any);
    if (!pid) {
        return { success: false, error: null, message: "Missing product_id" };
    }
    const {data,error} = await supabase.from("cart_items").delete().eq("cart_id",CartId).eq("product_id",pid)
    if(error){
        return {success:false,error:error,message:"Failed to remove from cart"}
    }
    else{
        const updatedCartItems = await getCartData(CartId,supabase)
        if(updatedCartItems.success){
            return updatedCartItems.data as DbCart;
        }
        return { success: false, error: null, message: "Failed to get cart data" };
    }
}

export const decreaseQuantityFromDbCart = async (
  item: DbCartItem,
  CartId: string,
  supabase: SupabaseClient
): Promise<DbCartOpResult> => {
  const pid = item?.product_id;
  if (!pid) return { success: false, error: null, message: "Missing product_id" };
  if (Number(item.quantity) <= 1) {
    const updatedCartItems = await getCartData(CartId, supabase);
    return updatedCartItems.success
      ? (updatedCartItems.data as DbCart)
      : { success: false, error: null, message: "Quantity is already 1" };
  }

  const nextQty = Math.max(Number(item.quantity) - 1, 1);
  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity: nextQty })
    .eq("cart_id", CartId)
    .eq("product_id", pid);

  if (error) {
    return { success: false, error: error, message: "Failed to decrease quantity from cart" };
  }

  const updatedCartItems = await getCartData(CartId, supabase);
  if (updatedCartItems.success) {
    return updatedCartItems.data as DbCart;
  }
  return { success: false, error: null, message: "Failed to get updated cart" };
};

// Calculate cart count from cart items array
export const calculateCartCount = (cartItems: AnyCart | any[]): number => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;
    return cartItems.reduce((sum: number, item: any) => sum + (item.quantity ?? 1), 0);
}

// Get cart items from local storage
export const getLocalCartItems = (): LocalCart => {
    if (typeof window === 'undefined') return [];
    const localCartItems = localStorage.getItem('cartItems');
    if (!localCartItems) return [];
    try {
        const cartItems: LocalCart = JSON.parse(localCartItems);
        return Array.isArray(cartItems) ? cartItems : [];
    } catch {
        return [];
    }
};

// Get cart count from local storage
export const getLocalCartCount = (): number => {
    if (typeof window === 'undefined') return 0;
    const localCartItems = localStorage.getItem('cartItems');
    if (!localCartItems) return 0;
    try {
        const cartItems: LocalCart = JSON.parse(localCartItems);
        return calculateCartCount(cartItems);
    } catch {
        return 0;
    }
}

// Get cart count from database
export const getDbCartCount = async (cartId: string, supabase: any): Promise<number> => {
    if (!cartId) return 0;
    const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", cartId);
    
    if (error || !data) return 0;
    return data.reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0);
}

/**
 * Merges local cart into DB, fetches full cart via getCartData, and calls setCartItems.
 * Use after login to hydrate cart instantly without page refresh.
 */
export const hydrateCartAfterLogin = async (
  cartId: string,
  supabase: SupabaseClient,
  setCartItems: (items: AnyCart) => void
): Promise<void> => {
  if (typeof window === "undefined") return;

  try {
    const localCartItems = localStorage.getItem("cartItems");
    if (localCartItems) {
      const localCartItemsArray: LocalCart = JSON.parse(localCartItems);
      if (Array.isArray(localCartItemsArray) && localCartItemsArray.length > 0) {
        const { data: existingCartItems, error: fetchError } = await supabase
          .from("cart_items")
          .select("product_id, quantity")
          .eq("cart_id", cartId);

        if (!fetchError && existingCartItems) {
          const existingProductsMap = new Map(
            existingCartItems.map((item) => [item.product_id, item.quantity])
          );

          const updatePromises = localCartItemsArray.map(async (item) => {
            const productId = item.products?.product_id;
            const localQuantity = item.quantity || 1;
            if (!productId) return;

            if (existingProductsMap.has(productId)) {
              const currentQuantity = existingProductsMap.get(productId) || 0;
              await supabase
                .from("cart_items")
                .update({ quantity: currentQuantity + localQuantity })
                .eq("cart_id", cartId)
                .eq("product_id", productId);
            } else {
              await supabase.from("cart_items").insert({
                cart_id: cartId,
                product_id: productId,
                quantity: localQuantity,
              });
            }
          });

          await Promise.allSettled(updatePromises);
        }
        localStorage.removeItem("cartItems");
      }
    }

    const { success, data } = await getCartData(cartId, supabase);
    if (success && data) {
      setCartItems(data);
    } else {
      setCartItems([]);
    }
  } catch (error) {
    console.error("hydrateCartAfterLogin error:", error);
    const { success, data } = await getCartData(cartId, supabase);
    if (success && data) setCartItems(data);
    else setCartItems([]);
    localStorage.removeItem("cartItems");
  }
}