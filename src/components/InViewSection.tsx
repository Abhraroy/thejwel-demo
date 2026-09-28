"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

interface InViewSectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Distance in px before the element enters the viewport to trigger mounting */
  rootMargin?: string;
}

export default function InViewSection({
  children,
  fallback = null,
  rootMargin = "200px",
}: InViewSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasBeenInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasBeenInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasBeenInView, rootMargin]);

  return <div ref={ref}>{hasBeenInView ? children : fallback}</div>;
}
