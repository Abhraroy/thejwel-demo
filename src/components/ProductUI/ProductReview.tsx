"use client";

import { useState, useEffect } from "react";
import OptimizedImage from "@/components/OptimizedImage";
import { FaStar } from "react-icons/fa";
import { IoIosClose } from "react-icons/io";
import ReviewForm from "./ReviewForm";
import { useParams } from "next/navigation";

export default function ProductReview({ reviews }: { reviews: any }) {
  const params = useParams();
  const productId = params?.product_id as string;
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [modalImage, setModalImage] = useState<string>("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Collect all review images
  const allReviewImages = reviews
    .filter((review: any) => review.review_images && review.review_images.length > 0)
    .flatMap((review: any) => review.review_images!);

  const previewImages = allReviewImages.slice(0, 9); // Show first 9 images

  const handleImageClick = (imageUrl: string) => {
    // Find the image in allReviewImages array
    const foundIndex = allReviewImages.findIndex((img: any) => img.review_image_url === imageUrl);
    if (foundIndex >= 0) {
      setModalImageIndex(foundIndex);
      setModalImage(imageUrl);
      setShowImageModal(true);
    }
  };

  const handleViewMoreImages = () => {
    if (allReviewImages.length === 0) return;
    setModalImage(allReviewImages[0].review_image_url);
    setModalImageIndex(0);
    setShowImageModal(true);
  };

  const handleModalClose = () => {
    setShowImageModal(false);
    setModalImage("");
  };

  const handleModalNavigate = (direction: "prev" | "next") => {
    let newIndex;
    if (direction === "prev") {
      newIndex = modalImageIndex === 0 ? allReviewImages.length - 1 : modalImageIndex - 1;
    } else {
      newIndex = modalImageIndex === allReviewImages.length - 1 ? 0 : modalImageIndex + 1;
    }
    setModalImageIndex(newIndex);
    setModalImage(allReviewImages[newIndex]?.review_image_url || "");
  };

  const handleRatingFilter = (rating: number) => {
    setSelectedRatingFilter((prev) => (prev === rating ? null : rating));
  };

  const filteredReviews = selectedRatingFilter
    ? reviews.filter((review: any) => Math.round(review.rating) === selectedRatingFilter)
    : reviews;

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length
    : 0;

  const reviewDistribution = new Array(6).fill(0);
  reviews.forEach((review: any) => {
    const roundedRating = Math.round(review.rating);
    if (roundedRating >= 1 && roundedRating <= 5) {
      reviewDistribution[roundedRating]++;
    }
  });

  const distributionData = [5, 4, 3, 2, 1].map((star) => {
    const count = reviewDistribution[star] || 0;
    const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, percent };
  });

  const renderReviewCard = (review: any) => {
    const user = review?.users ?? {};
    const initial =
      (user.email && user.email.charAt(0).toUpperCase()) ||
      (user.first_name && user.first_name.charAt(0).toUpperCase()) ||
      "U";
    const reviewDate = review?.created_at
      ? new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : "";

    return (
      <div
        key={review.review_id}
        className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </span>
                {review.verified && (
                  <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">{renderStars(review.rating)}</div>
                <span className="text-xs text-gray-500">{reviewDate}</span>
              </div>
            </div>
          </div>
          {review.review_images && review.review_images.length > 0 && (
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 relative">
              <OptimizedImage
                src={review.review_images[0].review_image_url}
                alt="Review"
                preset="thumbnail"
                width={64}
                height={64}
                objectFit="cover"
              />
            </div>
          )}
        </div>
        {review.title && (
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{review.title}</h4>
        )}
        {review.review_text && (
          <p className="text-sm text-gray-700 leading-relaxed">{review.review_text}</p>
        )}
        {review.review_images && review.review_images.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            {review.review_images.slice(1, 4).map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => handleImageClick(img.review_image_url)}
                className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 hover:border-pink-400 transition-colors relative"
              >
                <OptimizedImage
                  src={img.review_image_url}
                  alt="Review"
                  preset="thumbnail"
                  width={64}
                  height={64}
                  objectFit="cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleReviewSuccess = () => {
    // Close the form and reload the page to refresh reviews
    setShowReviewForm(false);
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className=" py-6 md:py-8 px-4 md:px-6 lg:px-8 ">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {productId && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 hover:from-rose-600 hover:via-pink-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <span className="flex items-center gap-2">
                <FaStar className="w-4 h-4" />
                Rate Product
              </span>
            </button>
          )}
        </div>

        {/* Summary Section - Compact */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* Rating Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {reviews.length > 0 ? averageRating.toFixed(1) : "0.0"}
              </span>
              <span className="text-lg text-gray-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {renderStars(averageRating)}
            </div>
            <p className="text-sm text-gray-600">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
            
            {/* Rating Distribution - Compact */}
            {reviews.length > 0 && (
              <div className="mt-4 space-y-2">
                {distributionData.map(({ star, percent, count }) => (
                  <button
                    key={star}
                    onClick={() => handleRatingFilter(star)}
                    className={`w-full flex items-center gap-2 text-xs ${
                      selectedRatingFilter === star
                        ? "text-pink-600 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    <span className="w-6">{star}★</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          selectedRatingFilter === star ? "bg-pink-500" : "bg-yellow-400"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right">{percent}%</span>
                  </button>
                ))}
              </div>
            )}
            
            {selectedRatingFilter && (
              <button
                onClick={() => setSelectedRatingFilter(null)}
                className="mt-3 w-full text-xs text-pink-600 hover:text-pink-700 font-medium"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Customer Photos - Compact */}
          <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Customer Photos</h3>
              {allReviewImages.length > 9 && (
                <button
                  onClick={handleViewMoreImages}
                  className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                >
                  View All ({allReviewImages.length})
                </button>
              )}
            </div>
            {previewImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {previewImages.map((image: any, index: number) => (
                  <button
                    key={image.review_image_id || index}
                    onClick={() => handleImageClick(image.review_image_url)}
                    className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-pink-400 transition-colors relative"
                  >
                    <OptimizedImage
                      src={image.review_image_url}
                      alt="Review"
                      preset="thumbnail"
                      fill
                      objectFit="cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-gray-500">No customer photos yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review: any) => renderReviewCard(review))
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-600 mb-1">No reviews yet</p>
              <p className="text-xs text-gray-500">Be the first to review this product</p>
            </div>
          ) : (
            <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-sm font-medium text-gray-600">No reviews match your filter</p>
              <button
                onClick={() => setSelectedRatingFilter(null)}
                className="mt-2 text-xs text-pink-600 hover:text-pink-700 font-medium"
              >
                Clear filter to see all reviews
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={handleModalClose}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 z-10"
            >
              <IoIosClose className="w-8 h-8" />
            </button>
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
              {allReviewImages[modalImageIndex] && (
                <OptimizedImage
                  src={allReviewImages[modalImageIndex].review_image_url}
                  alt="Review"
                  preset="full"
                  fill
                  objectFit="contain"
                />
              )}
            </div>
            {allReviewImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => handleModalNavigate("prev")}
                  className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  ← Prev
                </button>
                <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">
                  {modalImageIndex + 1} / {allReviewImages.length}
                </span>
                <button
                  onClick={() => handleModalNavigate("next")}
                  className="bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && productId && (
        <ReviewForm
          productId={productId}
          onClose={() => setShowReviewForm(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
