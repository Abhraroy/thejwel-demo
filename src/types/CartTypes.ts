import type { Cart, CartItem, Product } from "./TypeInterface";
import type { productWithImages } from "./RelationTypeInterface";

/**
 * Product shape we may store inside local cart.
 * (Local cart stores the whole product object under `products`.)
 */
export type CartProduct = Product | productWithImages;

/**
 * Local (logged-out) cart item shape stored in localStorage key `cartItems`.
 *
 * Example:
 * `{ products: { product_id: "...", ... }, quantity: 2 }`
 */
export type LocalCartItem<P extends CartProduct = CartProduct> = {
  products: P;
  quantity: number;
};

export type LocalCart = LocalCartItem[];

/**
 * DB cart item shape we usually work with in UI after joining `products(*)`.
 */
export type DbCartItem = CartItem & {
  products: Product | null;
  cart?: Cart | null;
};

export type DbCart = DbCartItem[];

export type AnyCartItem = LocalCartItem | DbCartItem;
export type AnyCart = LocalCart | DbCart;

export const isDbCartItem = (item: AnyCartItem): item is DbCartItem => {
  return (
    typeof item === "object" &&
    item !== null &&
    "cart_id" in item &&
    "product_id" in item
  );
};

export const isLocalCartItem = (item: AnyCartItem): item is LocalCartItem => {
  return (
    typeof item === "object" &&
    item !== null &&
    "products" in item &&
    !("cart_id" in item)
  );
};

