import type { Style } from "@/types/TypeInterface";

export type StyleFallbackConfig = {
  heading: string;
  gradient: string;
  description?: string;
  textColor?: string;
};

export type StyleDisplayItem = {
  style_id?: string;
  slug: string;
  name: string;
  href: string;
  imageLink?: string | null;
  gradient?: string;
  textColor?: string;
  description?: string;
};

export const STYLE_FALLBACKS: Record<string, StyleFallbackConfig> = {
  "american-diamond": {
    heading: "American Diamond",
    description:
      "Why choose between style and savings? Our American Diamond collection delivers dazzling brilliance for every occasion",
    gradient:
      "linear-gradient(145deg, #a8c5e0 0%, #c5d8eb 25%, #e8e4f4 50%, #d4d0e8 75%, #b8c8dc 100%)",
    textColor: "#4a5d6e",
  },
  "temple-jewellery": {
    heading: "Temple Jewellery",
    description:
      "Celebrate the rich legacy of Indian artistry with our exquisite Temple Jewelry collection — where tradition meets contemporary elegance.",
    gradient:
      "linear-gradient(145deg, #f5e6d3 0%, #e8d4b8 30%, #d4b896 60%, #c4a574 85%, #a68b5b 100%)",
    textColor: "#5c4033",
  },
  "anti-tarnish": {
    heading: "Anti tarnish",
    description:
      "Long-lasting shine without the worry. Our Anti tarnish collection keeps your favourite pieces looking fresh, day after day.",
    gradient:
      "linear-gradient(145deg, #eef1f4 0%, #d4dce4 30%, #b8c5d0 60%, #9aadb8 85%, #7a919e 100%)",
    textColor: "#2d3a45",
  },
};

export const STYLE_SLUG_ORDER = ["american-diamond", "temple-jewellery", "anti-tarnish"];

export function mergeStyleDisplay(row: Pick<Style, "style_id" | "style_name" | "slug" | "image_link">): StyleDisplayItem {
  const slug = (row.slug ?? "").trim();
  const fallback = slug ? STYLE_FALLBACKS[slug] : undefined;
  const name = row.style_name || fallback?.heading || slug;
  const imageLink = row.image_link?.trim() || null;

  return {
    style_id: row.style_id,
    slug,
    name,
    href: slug ? `/style/${encodeURIComponent(slug)}` : "#",
    imageLink,
    gradient: fallback?.gradient,
    textColor: fallback?.textColor,
    description: fallback?.description,
  };
}

export function buildStyleDisplayList(dbRows: Style[] | null | undefined): StyleDisplayItem[] {
  const rows = dbRows ?? [];
  if (rows.length === 0) {
    return STYLE_SLUG_ORDER.map((slug) => {
      const fallback = STYLE_FALLBACKS[slug];
      return mergeStyleDisplay({
        style_id: slug,
        style_name: fallback.heading,
        slug,
        image_link: null,
      });
    });
  }

  const sorted = [...rows].sort((a, b) => {
    const aIdx = STYLE_SLUG_ORDER.indexOf(a.slug ?? "");
    const bIdx = STYLE_SLUG_ORDER.indexOf(b.slug ?? "");
    if (aIdx === -1 && bIdx === -1) return (a.style_name ?? "").localeCompare(b.style_name ?? "");
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return sorted.map((row) => mergeStyleDisplay(row));
}
