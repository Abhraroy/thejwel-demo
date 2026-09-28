import { Suspense } from "react";
import OptimizedImage from "@/components/OptimizedImage";
import Link from "next/link";
import Carousel from "@/components/Carousel";
import CategorySection from "@/components/CategorySection";
import ShopByBudgetSection from "@/components/ShopByBudgetSection";
import StyleSection from "@/components/StyleSection";
import OccasionSection from "@/components/OccasionSection";
import { Product } from "@/types/TypeInterface";
import type { OccasionDisplayItem } from "@/lib/occasion-fallbacks";
import type { StyleDisplayItem } from "@/lib/style-fallbacks";
import ProductCarouselSkeleton from "@/components/ProductUI/ProductCaraouselSkeleton";
import HomePageClientShell from "./HomePageClientShell";
import InViewSection from "./InViewSection";
import {
  DynamicBestSellers,
  DynamicTrending,
  DynamicFeatured,
  DynamicNewArrivals,
  DynamicImageGallery,
} from "./DynamicHomeSections";

function CarouselSkeleton() {
  return (
    <div className="w-full aspect-[16/9] md:aspect-auto md:h-[500px] lg:h-[600px] xl:h-[700px] bg-gray-200 animate-pulse" />
  );
}

function CategorySectionSkeleton() {
  return (
    <section className="w-full py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-7 w-48 mx-auto bg-gray-200 animate-pulse rounded mb-6" />
        <div className="flex gap-4 justify-center flex-wrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImageGalleryCarouselSkeleton() {
  return (
    <section className="w-full py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-14">
          <div className="h-8 md:h-12 w-48 md:w-64 mx-auto bg-gray-200 animate-pulse rounded mb-3" />
          <div className="h-4 w-96 mx-auto bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="relative">
          <div className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[550px] bg-gray-200 animate-pulse rounded-2xl" />
          <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-300 animate-pulse rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type GalleryImage = { src: string; alt: string; title?: string };

export default function HomePage({
  categoriesProps,
  bestSellers,
  newArrivals,
  featuredProducts,
  trendingProducts,
  heroItems,
  galleryItems = [],
  stylesData,
  occasionsData,
}: {
  categoriesProps: any;
  bestSellers: Product[];
  newArrivals: Product[];
  featuredProducts: Product[];
  trendingProducts: Product[];
  heroItems: { imageLink: string; redirectRoute: string | null }[];
  galleryItems?: GalleryImage[];
  stylesData: StyleDisplayItem[];
  occasionsData: OccasionDisplayItem[];
}) {
  const carouselItemsArray = heroItems.map((item, index) => {
    const image = (
      <OptimizedImage
        src={item.imageLink}
        alt="Where Tradition Meets Modern Sparkle — TheJWEL Kolkata"
        fill
        objectFit="contain"
        className="md:!object-cover object-center"
        priority={index === 0}
        sizes="100vw"
      />
    );
    const wrapperClass = "w-full h-full relative flex items-center justify-center bg-theme-cream" + (item.redirectRoute ? " cursor-pointer" : "");
    return (
      <div key={index} className={wrapperClass}>
        {item.redirectRoute ? (
          <Link
            href={item.redirectRoute}
            className="absolute inset-0 z-10 block"
            {...(item.redirectRoute.startsWith("http") && {
              target: "_blank",
              rel: "noopener noreferrer",
            })}
          >
            {image}
          </Link>
        ) : (
          image
        )}
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-theme-cream">
      <HomePageClientShell categoriesProps={categoriesProps} />
      <main className="w-full">
        <Suspense fallback={<CarouselSkeleton />}>
          <Carousel
            items={carouselItemsArray}
            autoSlideInterval={3000}
            heightClassName="aspect-[16/9] md:aspect-auto md:h-[500px] lg:h-[600px] xl:h-[700px]"
            className="w-full overflow-hidden flex items-center justify-center"
          />
        </Suspense>

        {categoriesProps && categoriesProps.length > 0 ? (
          <CategorySection categories={categoriesProps} />
        ) : (
          <CategorySectionSkeleton />
        )}

        

        {/* <InViewSection fallback={<ProductCarouselSkeleton title="Best Sellers" />}>
          {bestSellers && bestSellers.length > 0 ? (
            <DynamicBestSellers products={bestSellers} />
          ) : (
            <ProductCarouselSkeleton title="Best Sellers" />
          )}
        </InViewSection> */}

        <InViewSection fallback={<ProductCarouselSkeleton title="Trending" />}>
          {trendingProducts && trendingProducts.length > 0 ? (
            <DynamicTrending products={trendingProducts} />
          ) : (
            <ProductCarouselSkeleton title="Trending" />
          )}
        </InViewSection>


        <ShopByBudgetSection />

        {/* <InViewSection fallback={<ProductCarouselSkeleton title="Featured Products" />}>
          {featuredProducts && featuredProducts.length > 0 ? (
            <DynamicFeatured products={featuredProducts} />
          ) : (
            <ProductCarouselSkeleton title="Featured Products" />
          )}
        </InViewSection> */}

        <StyleSection styles={stylesData} />

        <InViewSection fallback={<ProductCarouselSkeleton title="New Arrivals" />}>
          {newArrivals && newArrivals.length > 0 ? (
            <DynamicNewArrivals products={newArrivals} />
          ) : (
            <ProductCarouselSkeleton title="New Arrivals" />
          )}
        </InViewSection>

        <OccasionSection occasions={occasionsData} />

        <InViewSection fallback={<ImageGalleryCarouselSkeleton />}>
          <DynamicImageGallery images={galleryItems} />
        </InViewSection>
      </main>
    </div>
  );
}
