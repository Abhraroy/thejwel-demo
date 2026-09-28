"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-Utils/client";
import { STYLE_FALLBACKS, STYLE_SLUG_ORDER } from "@/lib/style-fallbacks";
import type { Category, Style } from "@/types/TypeInterface";

interface SidebarMenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

interface HamburgerSidebarProps {
  isSidebarOpen: boolean;
  onClose: () => void;
  filteredMenuItems: SidebarMenuItem[];
  onAccountClick: () => void;
}

type SidebarStyle = {
  style_id: string;
  label: string;
  slug: string;
};

function buildSidebarStyles(dbStyles: Style[] | null | undefined): SidebarStyle[] {
  if (dbStyles && dbStyles.length > 0) {
    const sorted = [...dbStyles].sort((a, b) => {
      const aIdx = STYLE_SLUG_ORDER.indexOf(a.slug ?? "");
      const bIdx = STYLE_SLUG_ORDER.indexOf(b.slug ?? "");
      if (aIdx === -1 && bIdx === -1) return (a.style_name ?? "").localeCompare(b.style_name ?? "");
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
    return sorted
      .filter((s) => s.slug)
      .map((s) => ({
        style_id: s.style_id,
        label: s.style_name,
        slug: s.slug!,
      }));
  }

  return STYLE_SLUG_ORDER.map((slug) => ({
    style_id: slug,
    label: STYLE_FALLBACKS[slug]?.heading ?? slug,
    slug,
  }));
}

const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const ChevronIcon = ({
  className = "w-5 h-5",
  expanded,
}: {
  className?: string;
  expanded: boolean;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={`${className} transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export default function HamburgerSidebar({
  isSidebarOpen,
  onClose,
  filteredMenuItems,
  onAccountClick,
}: HamburgerSidebarProps) {
  const [expandedStyle, setExpandedStyle] = useState<string | null>(null);
  const [sidebarStyles, setSidebarStyles] = useState<SidebarStyle[]>([]);
  const [categoriesByStyle, setCategoriesByStyle] = useState<
    Record<string, Category[]>
  >({});
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  const fetchInFlight = useRef(false);

  useEffect(() => {
    if (!isSidebarOpen) {
      setExpandedStyle(null);
      return;
    }

    if (sidebarStyles.length > 0 && Object.keys(categoriesByStyle).length > 0) return;
    if (fetchInFlight.current) return;

    fetchInFlight.current = true;
    let cancelled = false;

    void (async () => {
      setIsLoadingStyles(true);
      try {
        const supabase = createClient();

        const { data: stylesData } = await supabase
          .from("styles")
          .select("style_id, style_name, slug")
          .eq("is_active", true);

        const styles = buildSidebarStyles(stylesData ?? []);
        if (cancelled) return;

        setSidebarStyles(styles);

        const styleIds = styles
          .map((s) => s.style_id)
          .filter((id) => id && !STYLE_SLUG_ORDER.includes(id));

        let productRows: Array<{
          style_id: string;
          styles: { slug: string } | { slug: string }[] | null;
          categories: Category | Category[] | null;
        }> = [];

        if (styleIds.length > 0) {
          const { data, error } = await supabase
            .from("products")
            .select("style_id, styles(slug), categories(category_id, category_name, slug, category_image_url)")
            .eq("listed_status", true)
            .in("style_id", styleIds);

          if (!error && data) {
            productRows = data as typeof productRows;
          }
        }

        const grouped: Record<string, Map<string, Category>> = {};
        for (const style of styles) {
          grouped[style.slug] = new Map();
        }

        for (const row of productRows) {
          const styleData = row.styles;
          const styleSlug = (
            Array.isArray(styleData) ? styleData[0]?.slug : styleData?.slug
          )?.trim();
          const categoryData = row.categories;
          const category = Array.isArray(categoryData) ? (categoryData[0] ?? null) : categoryData;
          if (!styleSlug || !category?.category_id) continue;
          grouped[styleSlug]?.set(category.category_id, category);
        }

        const result: Record<string, Category[]> = {};
        for (const style of styles) {
          result[style.slug] = Array.from(grouped[style.slug]?.values() ?? []).sort((a, b) =>
            (a.category_name ?? "").localeCompare(b.category_name ?? "")
          );
        }

        if (!cancelled) {
          setCategoriesByStyle(result);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStyles(false);
          fetchInFlight.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
      fetchInFlight.current = false;
    };
  }, [isSidebarOpen, sidebarStyles.length, categoriesByStyle]);

  const toggleStyle = (slug: string) => {
    setExpandedStyle((prev) => (prev === slug ? null : slug));
  };

  const stylesToRender = sidebarStyles.length > 0
    ? sidebarStyles
    : buildSidebarStyles(null);

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 bg-opacity-50 z-50 md:hidden touch-none overscroll-none"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-80 bg-[#FAF9F6] text-[#360000] shadow-xl z-50 transition-transform duration-300 ease-in-out md:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-white/30">
            <h2 className="text-2xl text-[#360000] font-josefin-sans-extrabold tracking-wider">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 text-white hover:text-[#FFCDC9] transition-colors"
              aria-label="Close menu"
            >
              <CloseIcon className="w-7 h-7 text-[#360000] hover:text-[#360000]/80 hover:scale-125 rounded-full transition-all duration-200 ease-in-out  cursor-pointer" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-4">
              {stylesToRender.map((style) => {
                const isExpanded = expandedStyle === style.slug;
                const categories = categoriesByStyle[style.slug] ?? [];

                return (
                  <li key={style.slug}>
                    <button
                      type="button"
                      onClick={() => toggleStyle(style.slug)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-black/20 text-[#360000] hover:bg-[#CAF2FF]/70 rounded-lg transition-colors text-left"
                      aria-expanded={isExpanded}
                    >
                      <span className="font-medium font-open-sans tracking-wider">
                        {style.label}
                      </span>
                      <ChevronIcon expanded={isExpanded} />
                    </button>

                    {isExpanded && (
                      <ul className="mt-1 ml-2 space-y-1 border-l-2 border-[#360000]/20 pl-2">
                        {isLoadingStyles && categories.length === 0 ? (
                          Array.from({ length: 4 }).map((_, idx) => (
                            <li key={idx} className="px-2 py-2">
                              <div className="h-4 w-28 bg-white/30 rounded animate-pulse" />
                            </li>
                          ))
                        ) : categories.length > 0 ? (
                          categories.map((category) => (
                            <li key={category.category_id}>
                              <Link
                                href={`/category/${encodeURIComponent(category.slug)}`}
                                className="block px-3 py-2.5 text-[#360000] hover:bg-[#CAF2FF]/50 rounded-md transition-colors font-open-sans text-sm tracking-wide"
                                onClick={onClose}
                              >
                                {category.category_name}
                              </Link>
                            </li>
                          ))
                        ) : (
                          <li className="px-3 py-2.5 text-sm text-[#360000]/70 font-open-sans">
                            <Link
                              href={`/style/${encodeURIComponent(style.slug)}`}
                              className="hover:underline"
                              onClick={onClose}
                            >
                              Browse {style.label}
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}

              <li className="px-4 py-2 mt-4 mb-2 border-t border-white/30" />

              {filteredMenuItems.map((item, index) => {
                if (item.label === "My Account") {
                  return (
                    <li key={index}>
                      <button
                        onClick={onAccountClick}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-black/20 text-[#360000] rounded-lg transition-colors text-left"
                      >
                        {item.icon}
                        <span className="font-medium font-open-sans tracking-wider">{item.label}</span>
                      </button>
                    </li>
                  );
                }
                return (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 bg-black/20 text-[#360000] rounded-lg transition-colors"
                      onClick={onClose}
                    >
                      {item.icon}
                      <span className="font-medium font-open-sans tracking-wider">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
