import ProductCard from "@/components/ProductUI/ProductCard";

export default function MainLoading() {
  return (
    <div
      className="min-h-screen bg-theme-cream w-full"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="w-full aspect-[16/9] md:aspect-auto md:h-[500px] lg:h-[600px] bg-gray-200 animate-pulse" />

      <section className="w-full py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 animate-pulse">
          <div className="h-7 w-48 mx-auto bg-gray-200 rounded mb-6" />
          <div className="flex gap-4 justify-center flex-wrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-gray-200" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-6 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-56 mx-auto bg-gray-200 animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCard key={i} product={{}} isLoading />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
