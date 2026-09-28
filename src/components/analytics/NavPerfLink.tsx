"use client";

import type { ReactNode } from "react";
import Link from "next/link";

type NavPerfLinkProps = {
  href: string;
  className?: string;
  markName: string;
  children: ReactNode;
};

export default function NavPerfLink({
  href,
  className,
  markName,
  children,
}: NavPerfLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (process.env.NEXT_PUBLIC_NAV_PERF_DEBUG === "true") {
          performance.mark(markName);
        }
      }}
    >
      {children}
    </Link>
  );
}

