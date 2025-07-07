"use client";

import { GetProductReviewsParams } from "@/types/review";
import { ChangeEvent } from "react";
import { FiStar, FiImage, FiFilter } from "react-icons/fi";
import { useTranslations } from "next-intl";

interface ReviewFiltersProps {
  currentFilters: GetProductReviewsParams;
  onFilterChange: (newFilters: GetProductReviewsParams) => void;
  totalReviews?: number; // Số lượng review hiện tại để hiển thị (nếu cần)
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  currentFilters,
  onFilterChange,
}) => {
  const t = useTranslations("ReviewFilters");

  const ratingOptions = [
    { value: 0, label: t("allRatings") },
    { value: 5, label: t("star", { count: 5 }) },
    { value: 4, label: t("star", { count: 4 }) },
    { value: 3, label: t("star", { count: 3 }) },
    { value: 2, label: t("star", { count: 2 }) },
    { value: 1, label: t("star", { count: 1 }) },
  ];

  const handleRatingChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newRating = parseInt(e.target.value, 10);
    onFilterChange({
      ...currentFilters,
      rating: newRating > 0 ? newRating : undefined, // Bỏ filter rating nếu chọn "Tất cả"
      page: 1, // Reset về trang 1 khi đổi filter
    });
  };

  const handleHasImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...currentFilters,
      hasUserImages: e.target.checked ? true : undefined, // Bỏ filter nếu không check
      page: 1,
    });
  };

  return (
    <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 md:flex md:items-center md:justify-between md:space-y-0">
      <div className="flex items-center text-sm font-medium text-gray-700 md:mb-0">
        <FiFilter className="mr-2 h-5 w-5 text-gray-500" />
        {t("filterReviews")}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:flex md:gap-x-4">
        {/* Lọc theo Rating */}
        <div className="flex items-center">
          <label htmlFor="rating-filter" className="mr-2 text-sm text-gray-600 flex items-center">
            <FiStar className="mr-1 inline h-4 w-4 text-yellow-500" /> {t("ratingLabel")}
          </label>
          <select
            id="rating-filter"
            value={currentFilters.rating || 0}
            onChange={handleRatingChange}
            className="block w-full rounded-md border-gray-300 py-1.5 pr-8 pl-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:max-w-[150px]"
          >
            {ratingOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc theo có hình ảnh */}
        <div className="flex items-center">
          <input
            id="has-images-filter"
            type="checkbox"
            checked={!!currentFilters.hasUserImages}
            onChange={handleHasImagesChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="has-images-filter"
            className="ml-2 flex items-center text-sm text-gray-600"
          >
            <FiImage className="mr-1 inline h-4 w-4 text-gray-500" /> {t("hasImagesLabel")}
          </label>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;
