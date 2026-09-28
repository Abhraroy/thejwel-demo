import OptimizedImage from "@/components/OptimizedImage";
import NavPerfLink from "@/components/analytics/NavPerfLink";


export default function CategorySection({ 
  categories,
  // className = '' 
}: { categories: any }) {
  return (
    <section className={`w-full py-4 md:py-6 lg:py-8`} >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-4 md:mb-5 text-center font-josefin-sans tracking-wider">
          Shop by Category
        </h2>
        
        {/* Horizontal Scrollable Container */}
        <div className="overflow-x-auto scrollbar-hide px-1">
          <div className="flex gap-3 md:gap-5 pb-3 min-w-max md:min-w-0 md:justify-center md:flex-wrap pt-2">
            {categories.map((category: any) => (
              <NavPerfLink
                key={category.category_id}
                href={`/category/${encodeURIComponent(category.slug)}`}
                className="flex flex-col items-center group flex-shrink-0 w-20 md:w-24 lg:w-28"
                markName="nav-category-start"
              >
                {/* Circular Image Container */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-white ring-2 group-hover:ring-theme-olive transition-all duration-300 mb-2 md:mb-3 shadow-sm group-hover:shadow-md">
                  <OptimizedImage
                    src={category.category_image_url ?? ""}
                    alt={category.category_name}
                    preset="card"
                    fill
                    objectFit="cover"
                    className="group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 80px, (max-width: 1024px) 96px, 112px"
                  />
                </div>
                
                {/* Category Name */}
                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-[#360000] group-hover:text-[#360000]/80 text-center transition-colors duration-200 leading-tight">
                  {category.category_name}
                </span>
              </NavPerfLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

