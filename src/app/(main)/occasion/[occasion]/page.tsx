import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-Utils/server";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo/metadata";
import { Category } from "@/types/TypeInterface";
import { productWithImages } from "@/types/RelationTypeInterface";
import OccasionPageClient from "./OccasionPageClient";
import JsonLd from "@/components/seo/JsonLd";

type OccasionPageProps = {
  params: Promise<{ occasion: string }>;
};

async function getOccasionBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("occasions")
    .select("occasion_id, occasion_name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: OccasionPageProps): Promise<Metadata> {
  const { occasion } = await params;
  const decodedOccasion = decodeURIComponent(occasion || "");
  const occasionRow = await getOccasionBySlug(decodedOccasion);
  const displayName = occasionRow?.occasion_name ?? decodedOccasion;

  return buildPageMetadata({
    title: `${displayName} Jewellery`,
    description: `Shop ${displayName} jewellery at THE JWEL. Discover occasion-ready designs across categories and price ranges.`,
    pathname: `/occasion/${encodeURIComponent(decodedOccasion)}`,
  });
}

export default async function OccasionPage({ params }: OccasionPageProps) {
  const { occasion } = await params;
  const decodedOccasion = decodeURIComponent(occasion || "");
  const supabase = await createClient();

  const occasionRow = await getOccasionBySlug(decodedOccasion);
  if (!occasionRow?.occasion_id) {
    notFound();
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images(*),
      categories(*),
      occasions(occasion_id, occasion_name, slug)
      `
    )
    .eq("occasion_id", occasionRow.occasion_id)
    .eq("listed_status", true)
    .order("updated_at", { ascending: false });

  const productsData = (error ? [] : data ?? []) as productWithImages[];
  const unique = new Map<string, Category>();
  for (const p of productsData) {
    const c = p.categories ?? null;
    if (c?.category_id) unique.set(c.category_id, c);
  }
  const categories = Array.from(unique.values()).sort((a, b) =>
    (a.category_name ?? "").localeCompare(b.category_name ?? "")
  );

  const displayName = occasionRow.occasion_name ?? decodedOccasion;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${displayName} products`,
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
      <OccasionPageClient
        occasionName={displayName}
        initialProducts={productsData}
        initialCategories={categories}
      />
    </>
  );
}
