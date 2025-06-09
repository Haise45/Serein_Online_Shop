// src/components/client/product/ReviewItem.tsx
"use client";

import RatingStars from "@/components/shared/RatingStars";
import { formatDate, sanitizeHtmlContent } from "@/lib/utils";
import { Review } from "@/types/review";
import Image from "next/image";
import { FiCornerUpRight, FiZoomIn } from "react-icons/fi"; // Thay đổi icon zoom
import { useState } from "react";
import ReviewImageLightbox from "./ReviewImageLightbox"; // Import component modal mới

interface ReviewItemProps {
  review: Review;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ review }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndexInLightbox, setCurrentImageIndexInLightbox] =
    useState(0);

  const userName =
    typeof review.user === "object" && review.user !== null
      ? review.user.name
      : "Người dùng ẩn danh";

  const adminName =
    typeof review.adminReply?.user === "object" &&
    review.adminReply.user !== null
      ? review.adminReply.user.name
      : "Quản trị viên";

  const handleImageClick = (index: number) => {
    setCurrentImageIndexInLightbox(index);
    setIsLightboxOpen(true);
  };

  const handleLightboxNavigate = (newIndex: number) => {
    setCurrentImageIndexInLightbox(newIndex);
  };

  return (
    <>
      <div className="border-b border-gray-200 py-6 last:border-b-0">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500">
              <span className="text-lg leading-none font-medium">
                {userName.charAt(0).toUpperCase()}
              </span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">{userName}</p>
              <time
                dateTime={
                  typeof review.createdAt === "string"
                    ? review.createdAt
                    : review.createdAt.toISOString()
                }
                className="text-xs text-gray-500"
              >
                {formatDate(review.createdAt)}
              </time>
            </div>
            <div className="mt-1">
              <RatingStars rating={review.rating} size="sm" />
            </div>
            {review.comment && (
              <div
                className="prose prose-sm mt-2 max-w-none text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtmlContent(review.comment),
                }}
              />
            )}

            {review.userImages && review.userImages.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {review.userImages.map((imgUrl, idx) => (
                  <button // Thay div bằng button để dễ dàng focus và có ngữ nghĩa hơn
                    key={idx}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none"
                    onClick={() => handleImageClick(idx)}
                    aria-label={`Xem ảnh ${idx + 1} của ${userName} ở chế độ toàn màn hình`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Ảnh đánh giá ${idx + 1} của ${userName}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 120px"
                      quality={100}
                      priority={idx < 5}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100 group-focus:bg-black/40 group-focus:opacity-100">
                      <FiZoomIn className="h-6 w-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {review.adminReply && review.adminReply.comment && (
              <div className="mt-4 rounded-md bg-indigo-50 p-3 sm:p-4">
                {" "}
                {/* Điều chỉnh padding */}
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <FiCornerUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <p className="text-xs font-semibold text-indigo-700">
                        Phản hồi từ {adminName}
                      </p>
                      <time
                        dateTime={
                          typeof review.adminReply.createdAt === "string"
                            ? review.adminReply.createdAt
                            : review.adminReply.createdAt.toISOString()
                        }
                        className="text-xs whitespace-nowrap text-indigo-500"
                      >
                        {formatDate(review.adminReply.createdAt)}
                      </time>
                    </div>
                    <div
                      className="prose prose-xs mt-1 max-w-none text-indigo-800"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtmlContent(review.adminReply.comment),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Full Screen cho ảnh */}
      <ReviewImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={review.userImages || []}
        currentIndex={currentImageIndexInLightbox}
        onNavigate={handleLightboxNavigate}
        userNameForAlt={userName}
      />
    </>
  );
};

export default ReviewItem;
