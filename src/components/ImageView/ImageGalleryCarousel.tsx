"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import OptimizedImage from "@/components/OptimizedImage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-coverflow";

interface GalleryImage {
  src: string;
  alt: string;
  title?: string;
}

interface ImageGalleryCarouselProps {
  images?: GalleryImage[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const defaultImages: GalleryImage[] = [
  {
    src: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
    alt: "Gold necklace with gemstones",
    title: "Elegant Necklaces",
  },
  {
    src: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
    alt: "Diamond earrings",
    title: "Stunning Earrings",
  },
  {
    src: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80",
    alt: "Gold bangles",
    title: "Traditional Bangles",
  },
  {
    src: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
    alt: "Diamond ring",
    title: "Precious Rings",
  },
  {
    src: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
    alt: "Pearl jewelry set",
    title: "Pearl Collection",
  },
];

export default function ImageGalleryCarousel({
  images = defaultImages,
  autoPlay = true,
  autoPlayInterval = 4000,
  className = "",
}: ImageGalleryCarouselProps) {
  const safeImages = useMemo(
    () => (Array.isArray(images) ? images.filter(Boolean) : []),
    [images]
  );
  const slideCount = safeImages.length;

  const swiperRef = useRef<SwiperType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);

  const goToPrev = useCallback(() => swiperRef.current?.slidePrev(), []);
  const goToNext = useCallback(() => swiperRef.current?.slideNext(), []);
  const goToSlide = useCallback(
    (idx: number) => swiperRef.current?.slideToLoop(idx),
    []
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    swiperRef.current?.autoplay?.stop();
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    swiperRef.current?.autoplay?.start();
  }, []);

  // Autoplay progress bar
  useEffect(() => {
    if (!autoPlay || isHovered || slideCount <= 1) {
      setProgressPercent(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    setProgressPercent(0);
    const step = 50;
    const increment = (step / autoPlayInterval) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) return 100;
        return prev + increment;
      });
    }, step);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [autoPlay, isHovered, slideCount, autoPlayInterval, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToNext, goToPrev]);

  if (slideCount === 0) return null;

  return (
    <section className={`w-full bg-transparent py-6 md:py-10 lg:py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Section Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl lg:text-6xl text-[#360000] mb-3 font-josefin-sans tracking-wider">
            Our Gallery
          </h2>
          <p className="text-[#360000] text-sm md:text-base max-w-2xl mx-auto font-open-sans tracking-wider">
            Explore our exquisite collection of handcrafted jewelry pieces
          </p>
        </div>

        {/* Carousel Container */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="region"
          aria-roledescription="carousel"
          aria-label="Image gallery"
        >
          {/* Background glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 h-130 w-130 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#360000]/10 blur-3xl" />
            <div className="absolute left-1/3 top-1/3 h-105 w-105 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/10 blur-3xl" />
          </div>

          {/* Main Carousel */}
          <div className="relative max-w-full overflow-hidden">
            <div className="relative mx-auto h-85 max-w-6xl sm:h-110 md:h-135 lg:h-150">
              <Swiper
                modules={[Autoplay, EffectCoverflow]}
                onSwiper={(swiper) => { swiperRef.current = swiper; }}
                onSlideChange={(swiper) => {
                  setCurrentIndex(swiper.realIndex);
                  setProgressPercent(0);
                }}
                effect="coverflow"
                coverflowEffect={{
                  rotate: 0,
                  stretch: 80,
                  depth: 200,
                  modifier: 1,
                  slideShadows: false,
                }}
                centeredSlides
                slidesPerView="auto"
                loop={slideCount > 2}
                speed={500}
                autoplay={
                  autoPlay && slideCount > 1
                    ? { delay: autoPlayInterval, disableOnInteraction: false }
                    : false
                }
                className="h-full w-full gallery-swiper"
              >
                {safeImages.map((image, index) => (
                  <SwiperSlide
                    key={`${image.src}-${index}`}
                    className="gallery-slide"
                  >
                    {({ isActive }: { isActive: boolean }) => (
                      <div className="relative h-full w-full overflow-hidden rounded-3xl">
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/15 z-10"
                        />

                        <OptimizedImage
                          src={image.src}
                          alt={image.alt}
                          preset="full"
                          fill
                          objectFit="cover"
                          sizes="(max-width: 640px) 270px, (max-width: 768px) 340px, (max-width: 1024px) 420px, 470px"
                          priority={isActive}
                        />

                        {/* Overlay */}
                        <div
                          className={`absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent ${
                            isActive ? "opacity-100" : "opacity-70"
                          } transition-opacity duration-500`}
                        />

                        {/* Active title */}
                        {isActive && (image.title || image.alt) && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 z-10">
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <h3 className="text-white text-lg sm:text-xl md:text-2xl font-josefin-sans tracking-wider">
                                  {image.title ?? image.alt}
                                </h3>
                                <p className="mt-1 text-white/80 text-xs sm:text-sm font-open-sans tracking-wide">
                                  Swipe or use arrow keys
                                </p>
                              </div>
                              <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15 backdrop-blur-md">
                                <span className="text-white/90 text-xs font-open-sans tracking-wide">
                                  {currentIndex + 1}/{slideCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Navigation Arrows */}
              <div className="pointer-events-none absolute inset-0 hidden lg:flex items-center justify-between px-2 sm:px-4 z-20">
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={slideCount <= 1}
                  className="pointer-events-auto group relative grid h-11 w-11 md:h-12 md:w-12 place-items-center rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md ring-1 ring-white/20 shadow-lg transition disabled:opacity-40 disabled:hover:bg-black/35"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-white transition-transform group-hover:-translate-x-0.5" />
                </button>

                <button
                  type="button"
                  onClick={goToNext}
                  disabled={slideCount <= 1}
                  className="pointer-events-auto group relative grid h-11 w-11 md:h-12 md:w-12 place-items-center rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-md ring-1 ring-white/20 shadow-lg transition disabled:opacity-40 disabled:hover:bg-black/35"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-white transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

            </div>
          </div>

          {/* Dots Indicator */}
          <div className="mt-4 md:mt-5 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full bg-black/5 px-3 py-2 ring-1 ring-black/10 backdrop-blur-sm">
              {safeImages.map((img, index) => {
                const isActive = currentIndex === index;
                return (
                  <button
                    key={`${img.src}-${index}`}
                    type="button"
                    onClick={() => goToSlide(index)}
                    className={`relative h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#360000]/40 ${
                      isActive
                        ? "w-6 bg-[#360000]"
                        : "w-2.5 bg-[#360000]/35 hover:bg-[#360000]/55"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={isActive ? "true" : "false"}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .gallery-swiper .swiper-wrapper {
          align-items: center;
        }
        .gallery-slide {
          width: 270px;
          height: 360px;
          transition: opacity 0.4s ease, filter 0.4s ease;
          opacity: 0;
          filter: blur(1.5px);
        }
        @media (min-width: 640px) {
          .gallery-slide {
            width: 340px;
            height: 450px;
          }
        }
        @media (min-width: 768px) {
          .gallery-slide {
            width: 420px;
            height: 540px;
          }
        }
        @media (min-width: 1024px) {
          .gallery-slide {
            width: 470px;
            height: 610px;
          }
        }
        .gallery-slide.swiper-slide-prev,
        .gallery-slide.swiper-slide-next {
          opacity: 1;
          filter: blur(0px);
        }
        .gallery-slide.swiper-slide-active {
          opacity: 1;
          filter: blur(0px);
        }
      `}</style>
    </section>
  );
}
