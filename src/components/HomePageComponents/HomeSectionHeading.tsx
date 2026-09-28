import Link from "next/link";

interface HomeSectionHeadingProps {
  title: string;
  href?: string;
  subtitle?: string;
  className?: string;
  animated?: boolean;
}

const titleBaseClass =
  "text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#360000] relative inline-block font-josefin-sans tracking-wider";
const titleAnimateClass = "opacity-0 animate-fadeInUp";

export default function HomeSectionHeading({
  title,
  href,
  subtitle,
  className = "",
  animated = false,
}: HomeSectionHeadingProps) {
  const titleClass = `${titleBaseClass} ${animated ? titleAnimateClass : ""}`;
  const subtitleAnimateClass = animated
    ? "opacity-0 animate-fadeInUp animation-delay-200"
    : "";

  return (
    <div
      className={`flex flex-col items-center justify-center mb-3 md:mb-5 ${className}`}
    >
      {href ? (
        <Link href={href} className="group text-center">
          <h2
            className={`${titleClass} group-hover:text-[#360000]/80 transition-colors duration-500 ease-out`}
          >
            {title}
            <span className="absolute -bottom-2 left-0 right-0 h-0.5" />
            <span className="absolute -bottom-2 left-0 h-0.5 bg-[#360000] w-0 group-hover:w-full transition-all duration-500 ease-out" />
          </h2>
          <p className="text-center text-sm sm:text-base md:text-lg font-semibold text-[#360000]/60 mt-4 sm:mt-5 md:mt-6 group-hover:text-[#360000]/80 transition-colors duration-500 ease-out">
            View All →
          </p>
        </Link>
      ) : (
        <div className="text-center">
          <h2 className={titleClass}>{title}</h2>
          {subtitle && (
            <p
              className={`text-gray-600 text-sm sm:text-base md:text-lg mt-3 md:mt-4 ${subtitleAnimateClass}`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
