import CategoryClient from "./CategoryClient";
import { createClient } from "@/lib/supabase-Utils/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo/metadata";
import JsonLd from "@/components/seo/JsonLd";
import { cache } from "react";

type CategoryPageProps = {
  params: Promise<{ categoryslug: string }>;
};

const getCategoryBase = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("category_id, slug, category_name, description, category_image_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return null;
  return data;
});

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { categoryslug } = await params;
  const slug = decodeURIComponent(categoryslug);
  const category = await getCategoryBase(slug);

  if (!category) {
    return buildPageMetadata({
      title: "Shop Jewellery",
      description: "Explore jewellery at TheJwel. Browse categories and discover your next favorite piece.",
      pathname: `/category/${encodeURIComponent(slug)}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${category.category_name} Jewellery`,
    description:
      category.description ||
      `Find beautiful ${category.category_name} at TheJwel, created to add elegance and charm to your style. Perfect for daily wear, festive looks, and special moments.`,
    pathname: `/category/${encodeURIComponent(category.slug)}`,
    imagePath: category.category_image_url || "/faviconFolder/android-chrome-512x512.png",
  });
}

export default async function CategoryPage({ 
  params 
}: CategoryPageProps) {
  const { categoryslug } = await params;
  const slug = decodeURIComponent(categoryslug);
  const supabase = await createClient();

  const category = await getCategoryBase(slug);

  if (!category) {
    notFound();
  }

  const { data: subcategories } = await supabase
    .from("sub_categories")
    .select("subcategory_id, category_id, subcategory_name, subcategory_image_url, is_active")
    .eq("category_id", category.category_id)
    .eq("is_active", true);

  const { data: products } = await supabase
    .from("products")
    .select("product_id, product_name, base_price, discount_percentage, final_price, stock_quantity, updated_at, thumbnail_image, tags, subcategory_id")
    .eq("category_id", category.category_id)
    .eq("listed_status", true)
    .order("updated_at", { ascending: false });

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.category_name} products`,
    itemListElement: (products ?? []).slice(0, 100).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: toAbsoluteUrl(`/product/${encodeURIComponent(String(product.product_id))}`),
      name: product.product_name,
    })),
  };

  return (
    <>
      <JsonLd data={itemListSchema} />
      <CategoryClient
        category={category}
        subcategories={subcategories ?? []}
        products={products ?? []}
      />
    </>
  );
}





