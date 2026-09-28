import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-Utils/server";
import { BUDGET_RANGES, getBudgetRangeById } from "@/lib/budget-ranges";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo/metadata";
import { productWithImages } from "@/types/RelationTypeInterface";
import JsonLd from "@/components/seo/JsonLd";
import BudgetPageClient from "./BudgetPageClient";

type BudgetPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return BUDGET_RANGES.map((range) => ({ slug: range.id }));
}

export async function generateMetadata({ params }: BudgetPageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || "");
  const range = getBudgetRangeById(decodedSlug);

  if (!range) {
    return buildPageMetadata({
      title: "Budget not found",
      description: "The requested price range could not be found.",
      pathname: `/budget/${encodeURIComponent(decodedSlug)}`,
    });
  }

  return buildPageMetadata({
    title: `${range.label} Jewellery`,
    description: `Shop jewellery ${range.rangeText.toLowerCase()} at THE JWEL. Browse curated designs in your budget.`,
    pathname: `/budget/${encodeURIComponent(range.id)}`,
  });
}

export default async function BudgetPage({ params }: BudgetPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || "");
  const range = getBudgetRangeById(decodedSlug);

  if (!range) {
    notFound();
  }

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_images(*),
      categories(*)
      `
    )
    .eq("listed_status", true);

  if (range.minPrice != null) {
    query = query.gte("final_price", range.minPrice);
  }
  if (range.maxPrice != null) {
    query = query.lte("final_price", range.maxPrice);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  const productsData = (error ? [] : data ?? []) as productWithImages[];

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${range.label} products`,
    itemListElement: productsData.slice(0, 100).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: toAbsoluteUrl(`/product/${encodeURIComponent(String(product.product_id))}`),
      name: product.product_name,
    })),
  };

  return (
    <>
      <JsonLd data={itemListSchema} />
      <BudgetPageClient
        rangeLabel={range.label}
        rangeText={range.rangeText}
        initialProducts={productsData}
      />
    </>
  );
}
