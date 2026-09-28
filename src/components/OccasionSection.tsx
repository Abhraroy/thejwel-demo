import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import type { OccasionDisplayItem } from "@/lib/occasion-fallbacks";

type OccasionSectionProps = {
  occasions: OccasionDisplayItem[];
};

export default function OccasionSection({ occasions }: OccasionSectionProps) {
  return (
    <section className="w-full py-6 md:py-8 lg:py-10 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-5 md:mb-7">
          <h2 className="text-4xl md:text-6xl text-gray-900 mb-3 font-josefin-sans tracking-wider">
            What&apos;s The Occasion?
          </h2>
          <p className="text-gray-600 text-lg">
            Every moment hits different. So should your jewelry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {occasions.map((occasion) => (
            <Link
              key={occasion.occasion_id ?? occasion.slug}
              href={occasion.href}
              className="group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-[1.03] shadow-lg hover:shadow-2xl"
            >
              {occasion.imageLink ? (
                <>
                  <OptimizedImage
                    src={occasion.imageLink}
                    alt={occasion.name}
                    preset="full"
                    fill
                    objectFit="cover"
                    className="absolute inset-0 group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                </>
              ) : (
                <>
                  <div
                    className="absolute inset-0 backdrop-blur-2xl bg-white/30 ring-1 ring-black/10"
                    style={{ background: occasion.gradient }}
                  />
                  <div className="absolute inset-0 pointer-events-none border border-white/45" />
                </>
              )}
              <div className="relative z-10 p-5 md:p-6 lg:p-8 h-full flex flex-col items-center text-center">
                {occasion.badge && (
                  <span
                    className={`mb-4 inline-flex items-center px-3 py-1 rounded-full bg-white/80 text-xs font-semibold tracking-wide ${occasion.badgeColor ?? "text-gray-700"}`}
                  >
                    {occasion.badge}
                  </span>
                )}
                <h3
                  className={`text-2xl md:text-3xl font-bold mb-3 ${
                    occasion.imageLink ? "text-white" : "text-gray-900"
                  } ${occasion.titleClass ?? ""}`}
                >
                  {occasion.name}
                </h3>
                {occasion.description && (
                  <p className={`mb-6 ${occasion.imageLink ? "text-white/90" : "text-gray-700"}`}>
                    {occasion.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
