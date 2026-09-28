'use client';

import { useRef, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';

interface CarouselProps {
  items?: React.ReactNode[];
  autoSlideInterval?: number;
  className?: string;
  heightClassName?: string;
  slideClassName?: string;
}

export default function Carousel({
  items,
  autoSlideInterval = 6000,
  className = '',
  heightClassName = 'h-[200px] sm:h-[320px] md:h-[420px] lg:h-[520px]',
  slideClassName = '',
}: CarouselProps) {
  const safeItems = Array.isArray(items) ? items : [];
  const swiperRef = useRef<SwiperType | null>(null);

  const handleMouseEnter = useCallback(() => {
    swiperRef.current?.autoplay?.stop();
  }, []);

  const handleMouseLeave = useCallback(() => {
    swiperRef.current?.autoplay?.start();
  }, []);

  if (safeItems.length === 0) {
    return (
      <div
        className={[
          'relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50',
          heightClassName,
          className,
        ].join(' ')}
      >
        <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
          No carousel items to display
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        'relative w-full overflow-hidden group',
        heightClassName,
        '[&_img]:w-full [&_img]:h-full [&_img]:object-cover',
        className,
      ].join(' ')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        autoplay={{ delay: autoSlideInterval, disableOnInteraction: false }}
        loop={safeItems.length > 1}
        speed={500}
        pagination={{
          clickable: true,
          el: '.carousel-pagination',
          bulletClass: 'carousel-bullet',
          bulletActiveClass: 'carousel-bullet-active',
        }}
        className="h-full w-full"
      >
        {safeItems.map((item, index) => (
          <SwiperSlide
            key={index}
            className={['h-full w-full relative', slideClassName].join(' ')}
          >
            {item}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Previous Button */}
      {safeItems.length > 1 && (
        <button
          onClick={() => swiperRef.current?.slidePrev()}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#360000] rounded-full p-2 shadow-lg transition-all duration-200 z-10"
          aria-label="Previous slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Next Button */}
      {safeItems.length > 1 && (
        <button
          onClick={() => swiperRef.current?.slideNext()}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#360000] rounded-full p-2 shadow-lg transition-all duration-200 z-10"
          aria-label="Next slide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Dot Indicators */}
      {safeItems.length > 1 && (
        <div className="carousel-pagination absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10" />
      )}

      <style jsx global>{`
        .carousel-bullet {
          display: inline-block;
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: rgba(255,255,255,0.5);
          cursor: pointer;
          transition: all 0.2s;
        }
        .carousel-bullet:hover {
          background: rgba(255,255,255,0.75);
        }
        .carousel-bullet-active {
          width: 2rem;
          background: white;
        }
      `}</style>
    </div>
  );
}
