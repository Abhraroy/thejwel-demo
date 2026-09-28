import type { Occasion } from "@/types/TypeInterface";

export type OccasionFallbackConfig = {
  heading: string;
  badge: string;
  badgeColor: string;
  titleClass: string;
  description: string;
  gradient: string;
};

export type OccasionDisplayItem = {
  occasion_id?: string;
  slug: string;
  name: string;
  href: string;
  imageLink?: string | null;
  badge?: string;
  badgeColor?: string;
  titleClass?: string;
  description?: string;
  gradient?: string;
};

export const OCCASION_FALLBACKS: Record<string, OccasionFallbackConfig> = {
  everydaywear: {
    heading: "Everyday Wear",
    badge: "Daily Shine",
    badgeColor: "text-rose-600",
    titleClass: "font-adamina",
    description: "Elegant pieces for your daily style",
    gradient:
      "radial-gradient(900px circle at 18% 20%, rgba(244, 63, 94, 0.22), transparent 58%), radial-gradient(800px circle at 82% 28%, rgba(251, 191, 36, 0.18), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.22))",
  },
  partywear: {
    heading: "Party Wear",
    badge: "Night Out",
    badgeColor: "text-purple-600",
    titleClass: "font-satisfy",
    description: "Stunning pieces to make you shine",
    gradient:
      "radial-gradient(900px circle at 20% 24%, rgba(168, 85, 247, 0.22), transparent 58%), radial-gradient(800px circle at 85% 30%, rgba(59, 130, 246, 0.16), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.22))",
  },
  wedding: {
    heading: "Wedding",
    badge: "Wedding Finest",
    badgeColor: "text-amber-600",
    titleClass: "font-sacramento text-4xl md:text-5xl",
    description: "Timeless elegance for your special day",
    gradient:
      "radial-gradient(900px circle at 22% 22%, rgba(245, 158, 11, 0.24), transparent 58%), radial-gradient(820px circle at 84% 28%, rgba(244, 63, 94, 0.14), transparent 56%), linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.22))",
  },
};

export const OCCASION_SLUG_ORDER = ["everydaywear", "partywear", "wedding"];

export function mergeOccasionDisplay(
  row: Pick<Occasion, "occasion_id" | "occasion_name" | "slug" | "image_link">
): OccasionDisplayItem {
  const slug = (row.slug ?? "").trim();
  const fallback = slug ? OCCASION_FALLBACKS[slug] : undefined;
  const name = row.occasion_name || fallback?.heading || slug;
  const imageLink = row.image_link?.trim() || null;

  return {
    occasion_id: row.occasion_id,
    slug,
    name,
    href: slug ? `/occasion/${encodeURIComponent(slug)}` : "#",
    imageLink,
    badge: fallback?.badge,
    badgeColor: fallback?.badgeColor,
    titleClass: fallback?.titleClass,
    description: fallback?.description,
    gradient: fallback?.gradient,
  };
}

export function buildOccasionDisplayList(dbRows: Occasion[] | null | undefined): OccasionDisplayItem[] {
  const rows = dbRows ?? [];
  if (rows.length === 0) {
    return OCCASION_SLUG_ORDER.map((slug) => {
      const fallback = OCCASION_FALLBACKS[slug];
      return mergeOccasionDisplay({
        occasion_id: slug,
        occasion_name: fallback.heading,
        slug,
        image_link: null,
      });
    });
  }

  const sorted = [...rows].sort((a, b) => {
    const aIdx = OCCASION_SLUG_ORDER.indexOf(a.slug ?? "");
    const bIdx = OCCASION_SLUG_ORDER.indexOf(b.slug ?? "");
    if (aIdx === -1 && bIdx === -1) return (a.occasion_name ?? "").localeCompare(b.occasion_name ?? "");
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return sorted.map((row) => mergeOccasionDisplay(row));
}
