import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-Utils/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import RecommendedPageClient from "./RecommendedPageClient";

type RecommendedPageProps = {
  params: Promise<{ product_id: string }>;
};

export async function generateMetadata({ params }: RecommendedPageProps): Promise<Metadata> {
  const { product_id } = await params;
  return buildPageMetadata({
    title: "Recommended Products",
    description: "Browse recommended products curated for you.",
    pathname: `/product/${encodeURIComponent(product_id)}/recommended`,
  });
}

export default async function RecommendedPage({ params }: RecommendedPageProps) {
  const { product_id } = await params;
  const supabase = await createClient();

  const [productRes, recommendedProductsRes] = await Promise.all([
    supabase
      .from("products")
      .select("product_id, product_name")
      .eq("product_id", product_id)
      .eq("listed_status", true)
      .maybeSingle(),
    supabase.rpc("get_recommended_products", {
      current_product_id: product_id,
      result_limit: 100,
    }),
  ]);

  const product = productRes.data;
  const recommendedProducts = recommendedProductsRes.error
    ? []
    : recommendedProductsRes.data || [];

  if (!product) {
    return (
      <RecommendedPageClient
        productName={null}
        productId={product_id}
        products={[]}
        error="The product you're looking for doesn't exist."
      />
    );
  }

  return (
    <RecommendedPageClient
      productName={product.product_name}
      productId={product_id}
      products={recommendedProducts}
    />
  );
}
