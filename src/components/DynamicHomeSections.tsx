"use client";

import dynamic from "next/dynamic";
import type { Product } from "@/types/TypeInterface";

const BestSellersSection = dynamic(
  () => import("./HomePageComponents/BestSellerSection"),
  { ssr: false }
);
const NewArrivalSection = dynamic(
  () => import("./HomePageComponents/NewArrivalSection"),
  { ssr: false }
);
const FeaturedSection = dynamic(
  () => import("./HomePageComponents/FeaturedSection"),
  { ssr: false }
);
const TrendingSection = dynamic(
  () => import("./HomePageComponents/TrendingSection"),
  { ssr: false }
);
const ImageGalleryCarousel = dynamic(
  () => import("./ImageView/ImageGalleryCarousel"),
  { ssr: false }
);

interface GalleryImage {
  src: string;
  alt: string;
  title?: string;
}

interface ImageGalleryProps {
  images?: GalleryImage[];
}

interface ProductSectionProps {
  products: Product[];
}

export function DynamicBestSellers({ products }: ProductSectionProps) {
  return <BestSellersSection products={products} />;
}

export function DynamicFeatured({ products }: ProductSectionProps) {
  return <FeaturedSection products={products} />;
}

export function DynamicTrending({ products }: ProductSectionProps) {
  return <TrendingSection products={products} />;
}

export function DynamicNewArrivals({ products }: ProductSectionProps) {
  return <NewArrivalSection products={products} />;
}

export function DynamicImageGallery({ images }: ImageGalleryProps) {
  return <ImageGalleryCarousel images={images} />;
}
