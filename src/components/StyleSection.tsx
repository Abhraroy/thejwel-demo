import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import type { StyleDisplayItem } from "@/lib/style-fallbacks";

type StyleSectionProps = {
  styles: StyleDisplayItem[];
};

function StyleSection({ styles }: StyleSectionProps) {
  return (
    <section className="w-full bg-white py-4 md:py-6 lg:py-8">
      <div className="w-[95%] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {styles.map((style) => (
            <div
              key={style.style_id ?? style.slug}
              className="relative overflow-hidden flex flex-col items-center justify-center p-5 md:p-8 lg:p-10 min-h-[400px] md:min-h-[500px] lg:min-h-[600px] border border-theme-olive/30 hover:border-theme-olive transition-all duration-300
               bg-white
              "
            >
              {style.imageLink ? (
                <>
                  <div className="absolute inset-0">
                    <OptimizedImage
                      src={style.imageLink}
                      alt={style.name}
                      preset="full"
                      fill
                      objectFit="cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/35" aria-hidden />
                </>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: style.gradient }}
                  aria-hidden
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-3 md:gap-4 lg:gap-10 text-center">
                <h2
                  className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-sacramento drop-shadow tracking-wider"
                  style={{ color: style.imageLink ? "#ffffff" : style.textColor ?? "#4a5d6e" }}
                >
                  {style.name}
                </h2>

                <Link
                  href={style.href}
                  className="px-6 md:px-8 py-3 md:py-3.5 text-white font-semibold rounded-lg transition-all duration-300 text-sm md:text-base shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] bg-gradient-to-r from-pink-500 to-rose-500 hover:bg-theme-olive transform hover:scale-[1.02] active:scale-[0.98] font-open-sans tracking-wider"
                >
                  Explore Style
                </Link>

                {style.description && (
                  <p
                    className="text-xs md:text-sm lg:text-base max-w-md opacity-80"
                    style={{ color: style.imageLink ? "#ffffff" : style.textColor ?? "#4a5d6e" }}
                  >
                    {style.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StyleSection;
