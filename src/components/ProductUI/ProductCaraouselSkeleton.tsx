import ProductCard from "./ProductCard";

export default function ProductCarouselSkeleton({ title }: { title: string }) {
    const placeholderCards = Array.from({ length: 4 });
    return (
      <section className="w-full bg-theme-cream py-6 md:py-12 lg:py-16">
        <div className="flex items-center justify-center mb-5 md:mb-8 px-4 sm:px-6 lg:px-8">
          <div
            className="h-6 md:h-8 w-40 md:w-56 bg-gray-200 animate-pulse rounded"
            aria-label={title}
          />
        </div>
        <div className="relative w-full">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-6 pb-10 md:pb-12 pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8">
              {placeholderCards.map((_, idx) => (
                <div
                  key={idx}
                  className="product-card flex-shrink-0 w-[calc((100vw/1.3-3rem)*0.95)] sm:w-[calc((100vw/2-4rem)*0.95)] md:w-[calc((100vw/2.5-5rem)*0.95)] lg:w-[calc(100vw/3-6rem)] xl:w-[380px]"
                >
                  <ProductCard product={{}} isLoading />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }