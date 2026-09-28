export type BudgetRangeConfig = {
  id: string;
  label: string;
  /** Tagline words shown above the price on budget cards */
  tagline: readonly string[];
  /** Large price text on budget cards */
  priceDisplay: string;
  rangeText: string;
  minPrice: number | null;
  maxPrice: number | null;
  href?: string;
};

/** Matches ProductCard CTA: from-pink-500 to-rose-500, hover theme-olive */
export const BUDGET_CARD_BUTTON_CLASSES =
  "bg-gradient-to-r from-pink-500 to-rose-500 group-hover:bg-theme-olive";

export const BUDGET_RANGES: BudgetRangeConfig[] = [
  {
    id: "under-199",
    label: "Under ₹199",
    tagline: ["Under"],
    priceDisplay: "₹199",
    rangeText: "Up to ₹199",
    minPrice: null,
    maxPrice: 199,
    href: "/budget/under-199",
  },
  {
    id: "199-299",
    label: "₹199 – ₹299",
    tagline: ["under"],
    priceDisplay: "₹299",
    rangeText: "₹199 to ₹299",
    minPrice: 199,
    maxPrice: 299,
    href: "/budget/199-299",
  },
  {
    id: "300-399",
    label: "₹300 – ₹399",
    tagline: ["under"],
    priceDisplay: "₹399",
    rangeText: "₹300 to ₹399",
    minPrice: 300,
    maxPrice: 399,
    href: "/budget/300-399",
  },
  {
    id: "400-499",
    label: "₹400 – ₹499",
    tagline: ["under"],
    priceDisplay: "₹499",
    rangeText: "₹400 to ₹499",
    minPrice: 400,
    maxPrice: 499,
    href: "/budget/400-499",
  },
];

export function budgetListingHref(id: string): string {
  return `/budget/${encodeURIComponent(id)}`;
}

export function getBudgetRangeById(id: string): BudgetRangeConfig | undefined {
  return BUDGET_RANGES.find((range) => range.id === id);
}
