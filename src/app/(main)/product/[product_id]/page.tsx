import type { Metadata } from "next";
import ProductPageClient from "./ProductPageClient";
import { createClient } from "@/lib/supabase-Utils/server";
import { buildPageMetadata, toAbsoluteUrl } from "@/lib/seo/metadata";
import JsonLd from "@/components/seo/JsonLd";
import { cache } from "react";

type ProductPageProps = {
  params: Promise<{ product_id: string }>;
};


export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { product_id } = await params;
  const product = await getProductBase(product_id);

  if (!product) {
    return buildPageMetadata({
      title: "Product Not Found",
      description: "The requested product could not be found.",
      pathname: `/product/${encodeURIComponent(String(product_id))}`,
      noIndex: true,
    });
  }

  const categoryName = Array.isArray(product.categories)
    ? product.categories[0]?.category_name
    : (product.categories as { category_name?: string } | null)?.category_name;
  const title = categoryName
    ? `${product.product_name} | ${categoryName}`
    : product.product_name;

  return buildPageMetadata({
    title,
    description:
      (product.description || "").slice(0, 155) ||
      `Discover ${product.product_name} at TheJwel, crafted to enhance your style with elegance and comfort. A perfect choice for every occasion with timeless appeal.`,
    pathname: `/product/${encodeURIComponent(String(product.product_id))}`,
    imagePath: product.thumbnail_image || "/faviconFolder/android-chrome-512x512.png",
  });
}
const getProductBase = cache(async (productId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      product_id,
      product_name,
      description,
      thumbnail_image,
      base_price,
      discount_percentage,
      final_price,
      stock_quantity,
      size,
      tags,
      style_id,
      styles(style_id, style_name, slug, image_link),
      occasion_id,
      occasions(occasion_id, occasion_name, slug, image_link),
      sku,
      category_id,
      categories(category_name, slug)
    `)
    .eq("product_id", productId)
    .eq("listed_status", true)
    .maybeSingle();

  if (error) return null;
  return data;
});

export default async function ProductPage({ params }: ProductPageProps) {
  const { product_id } = await params;
  const supabase = await createClient();
  const [product, productImagesRes, reviewsRes , recommendedProductsRes] = await Promise.all([
    getProductBase(product_id),
    supabase
      .from("product_images")
      .select("image_id, product_id, image_url")
      .eq("product_id", product_id),
    supabase
      .from("reviews")
      .select(`
        review_id,
        product_id,
        user_id,
        rating,
        title,
        review_text,
        created_at,
        review_images(review_image_id, review_id, review_image_url),
        users(user_id, first_name, last_name, email)
      `)
      .eq("product_id", product_id),
    supabase.rpc(
      "get_recommended_products",
      {
        current_product_id: product_id,
        result_limit: 8
      }
    )
  ]);

  console.log("recommendedProductsRes", recommendedProductsRes);

  if (!product) {
    return (
      <ProductPageClient
        productDetails={[]}
        reviews={[]}
        error="The product you're looking for doesn't exist."
        recommendedProducts={[]}
      />
    );
  }

  const reviewData = reviewsRes.data || [];
  const reviewError = reviewsRes.error;

  const normalizedProduct = { ...product } as any;
  normalizedProduct.product_images = productImagesRes.data || [];
  normalizedProduct.reviews = reviewData;

  if (
    (!Array.isArray(normalizedProduct.product_images) || normalizedProduct.product_images.length === 0) &&
    normalizedProduct.thumbnail_image
  ) {
    normalizedProduct.product_images = [
      {
        image_url: normalizedProduct.thumbnail_image,
        product_id: normalizedProduct.product_id,
      },
    ];
  }

  const productUrl = toAbsoluteUrl(`/product/${encodeURIComponent(String(normalizedProduct.product_id))}`);
  const images = Array.isArray(normalizedProduct.product_images)
    ? normalizedProduct.product_images
        .map((img: any) => img?.image_url)
        .filter((img: string) => !!img)
    : [];
  const imageUrls = images.length > 0 ? images : [normalizedProduct.thumbnail_image].filter(Boolean);
  
  
  const schemaProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: normalizedProduct.product_name,
    description: normalizedProduct.description || "",
    sku: normalizedProduct.sku || undefined,
    image: imageUrls,
    category:
      (Array.isArray(normalizedProduct.categories)
        ? normalizedProduct.categories[0]?.category_name
        : normalizedProduct.categories?.category_name) || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: Number(normalizedProduct.final_price || 0),
      availability:
        Number(normalizedProduct.stock_quantity || 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: productUrl,
    },
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: toAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: toAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: normalizedProduct.product_name || "Product",
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={schemaProduct} />
      <JsonLd data={schemaBreadcrumb} />
      <ProductPageClient
        productDetails={[normalizedProduct]}
        recommendedProducts={recommendedProductsRes.data || []}
        reviews={reviewError ? [] : reviewData || []}
        
      />
    </>
  );
}
