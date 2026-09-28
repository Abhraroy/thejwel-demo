"use client";

import ProductCarousel from "@/components/ProductUI/ProductCarousel";
import { Product } from "@/types/TypeInterface";

interface Props {
  products: Product[];
  onAddToCart?: (id: string) => void;
  onWishlistToggle?: (id: string) => void;
}

export default function FeaturedSection({
  products,
  onAddToCart,
  onWishlistToggle,
}: Props) {
 
  if (!products.length) return null;

  return (
    <ProductCarousel
      sectionHeading="Featured Products"
      products={products}
      tagSlug="featured"
      onAddToCart={onAddToCart}
      onWishlistToggle={onWishlistToggle}
    />
  );
}
