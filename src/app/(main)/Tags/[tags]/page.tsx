import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-Utils/server";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo/metadata";
import TagsPageClient from "./TagsPageClient";
import JsonLd from "@/components/seo/JsonLd";

type TagsPageProps = {
  params: Promise<{ tags: string }>;
};

export async function generateMetadata({ params }: TagsPageProps): Promise<Metadata> {
  const { tags } = await params;
  const decodedTag = decodeURIComponent(tags || "");
  return buildPageMetadata({
    title: `${decodedTag} Jewellery`,
    description: `Browse ${decodedTag} jewellery from THE JWEL. Explore curated products by tag and find your perfect pick.`,
    pathname: `/tags/${encodeURIComponent(decodedTag)}`,
  });
}

export default async function TagsPage({ params }: TagsPageProps) {
  const { tags } = await params;
  const decodedTag = decodeURIComponent(tags || "");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images(*)
      `
    )
    .contains("tags", [decodedTag])
    .eq("listed_status", true)
    .order("updated_at", { ascending: false });

  const products = error ? [] : data || [];
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${decodedTag} tagged products`,
    itemListElement: products.slice(0, 100).map((product: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      url: toAbsoluteUrl(`/product/${encodeURIComponent(String(product.product_id))}`),
      name: product.product_name,
    })),
  };

  return (
    <>
      <JsonLd data={itemListSchema} />
      <TagsPageClient decodedTag={decodedTag} initialProducts={products} />
    </>
  );
}
