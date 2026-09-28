"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const isEnabled = process.env.NEXT_PUBLIC_NAV_PERF_DEBUG === "true";

function measureTransition(startMark: string, measureName: string) {
  const hasStart = performance.getEntriesByName(startMark).length > 0;
  if (!hasStart) return;
  try {
    performance.measure(measureName, startMark, "nav-route-commit");
    const latest = performance.getEntriesByName(measureName).slice(-1)[0];
    if (latest) {
      console.info(`[nav-perf] ${measureName}: ${Math.round(latest.duration)}ms`);
    }
  } catch {
    // no-op
  } finally {
    performance.clearMarks(startMark);
    performance.clearMeasures(measureName);
  }
}

export default function RoutePerfTracker() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    if (!isEnabled) return;
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performance.mark("nav-route-commit");
        measureTransition("nav-category-start", "category-click-to-route-commit");
        measureTransition("nav-product-start", "product-click-to-route-commit");
        performance.clearMarks("nav-route-commit");
      });
    });
  }, [pathname]);

  return null;
}

