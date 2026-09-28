"use client";

import dynamic from "next/dynamic";

const ProductDisplay = dynamic(() => import("@/components/ProductUI/ProductDisplay"), {
  loading: () => <ProductPageSkeleton />,
});

const ProductReview = dynamic(() => import("@/components/ProductUI/ProductReview"));
const ProductRecommended = dynamic(() => import("@/components/ProductUI/ProductRecommend"));
const SameCategoryProduct = dynamic(() => import("@/components/ProductUI/SameCategoryProduct"));
type ProductPageClientProps = {
  productDetails: any[] | null;
  reviews: any[];
  error?: string | null;
  recommendedProducts: any[];
};

const ProductPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-theme-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-4">
            <div className="w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-20 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-gray-200 rounded" />
            <div className="h-5 w-1/2 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-100 rounded-lg" />

            <div className="flex gap-3">
              <div className="h-10 w-28 bg-gray-200 rounded-full" />
              <div className="h-10 w-16 bg-gray-200 rounded-full" />
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-10 bg-gray-100 rounded-md" />
                ))}
              </div>
              <div className="h-12 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProductPageClient({
  productDetails,
  reviews,
  error,
  recommendedProducts,
}: ProductPageClientProps) {
  if (productDetails === null && !error) {
    return <ProductPageSkeleton />;
  }
  console.log("recommendedProducts", recommendedProducts);

  if (error || !productDetails || productDetails.length === 0) {
    return (
      <div className="min-h-screen bg-theme-cream flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-theme-sage hover:bg-theme-olive text-white font-medium rounded-lg transition-colors duration-200"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const product = productDetails[0];
  const productId = String(product?.product_id ?? "");
  const categoryId = product?.category_id ? String(product.category_id) : "";
  const categoryData = Array.isArray(product?.categories)
    ? product.categories[0]
    : product?.categories;
  const categoryName = categoryData?.category_name;
  const categorySlug = categoryData?.slug;

  return (
    <div className="min-h-screen bg-theme-cream flex flex-col">
      <ProductDisplay productDetails={productDetails} />
      {recommendedProducts.length > 0 ? (
        <ProductRecommended products={recommendedProducts} productId={productId} />
      ) : null}
      {categoryId ? (
        <SameCategoryProduct
          categoryId={categoryId}
          currentProductId={productId}
          categorySlug={categorySlug}
          categoryName={categoryName}
        />
      ) : null}
      {productId ? <ProductReview reviews={reviews ?? []} /> : null}
    </div>
  );
}
