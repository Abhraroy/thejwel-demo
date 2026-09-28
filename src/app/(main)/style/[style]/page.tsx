import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-Utils/server";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo/metadata";
import { Category } from "@/types/TypeInterface";
import { productWithImages } from "@/types/RelationTypeInterface";
import StylePageClient from "./StylePageClient";
import JsonLd from "@/components/seo/JsonLd";

type StylePageProps = {
  params: Promise<{ style: string }>;
};

async function getStyleBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("styles")
    .select("style_id, style_name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: StylePageProps): Promise<Metadata> {
  const { style } = await params;
  const decodedStyle = decodeURIComponent(style || "");
  const styleRow = await getStyleBySlug(decodedStyle);
  const displayName = styleRow?.style_name ?? decodedStyle;

  return buildPageMetadata({
    title: `${displayName} Jewellery Style`,
    description: `Explore ${displayName} jewellery at THE JWEL. Browse curated designs, compare prices, and shop with confidence.`,
    pathname: `/style/${encodeURIComponent(decodedStyle)}`,
  });
}

export default async function StylePage({ params }: StylePageProps) {
  const { style } = await params;
  const decodedStyle = decodeURIComponent(style || "");
  const supabase = await createClient();

  const styleRow = await getStyleBySlug(decodedStyle);
  if (!styleRow?.style_id) {
    notFound();
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images(*),
      categories(*),
      styles(style_id, style_name, slug)
      `
    )
    .eq("style_id", styleRow.style_id)
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

  const displayName = styleRow.style_name ?? decodedStyle;

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
      <StylePageClient
        styleName={displayName}
        initialProducts={productsData}
        initialCategories={categories}
      />
    </>
  );
}
