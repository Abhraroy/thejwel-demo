"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Captures ad attribution (fbclid -> _fbc, UTM params, landing URL) on first
 * load and cleans tracking params from the URL. Renders nothing.
 */
export default function AttributionTracker() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
