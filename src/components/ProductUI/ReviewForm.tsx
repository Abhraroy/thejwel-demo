"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase-Utils/client";
import { useStore } from "@/zustandStore/zustandStore";
import { FaStar, FaTimes } from "react-icons/fa";
import OptimizedImage from "@/components/OptimizedImage";
import PhoneNumberInput from "@/components/AuthUI/PhoneNumberInput";

interface ReviewFormProps {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewForm({ productId, onClose, onSuccess }: ReviewFormProps) {
  const supabase = createClient();
  const { AuthenticatedState, setMobnoInputState, AuthUserId } = useStore();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show login if not authenticated
  if (!AuthenticatedState) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please log in to submit a review for this product.
          </p>
          <PhoneNumberInput containerClassName="w-full" />
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    
    if (imageFiles.length + images.length > 5) {
      setError("You can upload a maximum of 5 images");
      return;
    }

    const newImages = [...images, ...imageFiles];
    setImages(newImages);

    // Create previews
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadReviewImages = async (reviewId: string): Promise<string[]> => {
    if (images.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const image of images) {
      try {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("folder", "reviews");

        const response = await fetch("/api/upload/review-image", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        }
      } catch (err) {
        console.error("Error uploading review image:", err);
      }
    }

    // Save image URLs to review_images table
    if (uploadedUrls.length > 0) {
      const { error: imageError } = await supabase
        .from("review_images")
        .insert(
          uploadedUrls.map((url) => ({
            review_id: reviewId,
            review_image_url: url,
          }))
        );

      if (imageError) {
        console.error("Error saving review images:", imageError);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!AuthUserId) {
      setError("User ID not found. Please log in again.");
      return;
    }

    setUploading(true);

    try {
      // Create the review
      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .insert({
          product_id: productId,
          user_id: AuthUserId,
          rating,
          title: title.trim() || null,
          review_text: reviewText.trim() || null,
        })
        .select()
        .single();

      if (reviewError) {
        throw new Error(reviewError.message);
      }

      // Upload images if any
      if (images.length > 0 && review?.review_id) {
        await uploadReviewImages(review.review_id);
      }

      // Reset form
      setRating(0);
      setTitle("");
      setReviewText("");
      setImages([]);
      setImagePreviews([]);

      // Call success callback to refresh reviews
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Write a Review</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <FaStar
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 fill-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating} {rating === 1 ? "star" : "stars"}
                </span>
              )}
            </div>
          </div>

          {/* Title Section */}
          <div>
            <label
              htmlFor="review-title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Review Title
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your review a title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900"
              maxLength={100}
            />
          </div>

          {/* Review Text Section */}
          <div>
            <label
              htmlFor="review-text"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Review
            </label>
            <textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900 resize-none"
              maxLength={1000}
            />
            <p className="mt-1 text-xs text-gray-500">
              {reviewText.length}/1000 characters
            </p>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Photos (Optional, up to 5)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={images.length >= 5}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 5 || uploading}
              className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-rose-400 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {images.length >= 5 ? "Maximum 5 images" : "Choose Images"}
            </button>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                      <OptimizedImage
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        objectFit="cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || rating === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 hover:from-rose-600 hover:via-pink-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </span>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
