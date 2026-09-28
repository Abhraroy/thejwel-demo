"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { clearBodyScrollLock } from "@/lib/body-scroll-lock";

export default function ScrollToTopOnNavigate() {
  const pathname = usePathname();

  useEffect(() => {
    clearBodyScrollLock();
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
