"use client";

import { GetProductReviewsParams } from "@/types/review";
import { ChangeEvent } from "react";
import { FiStar, FiImage, FiFilter } from "react-icons/fi";

interface ReviewFiltersProps {
  currentFilters: GetProductReviewsParams;
  onFilterChange: (newFilters: GetProductReviewsParams) => void;
  totalReviews?: number; // Số lượng review hiện tại để hiển thị (nếu cần)
}

const ratingOptions = [
  { value: 0, label: "Tất cả" },
  { value: 5, label: "5 sao" },
  { value: 4, label: "4 sao" },
  { value: 3, label: "3 sao" },
  { value: 2, label: "2 sao" },
  { value: 1, label: "1 sao" },
];

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  currentFilters,
  onFilterChange,
}) => {
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
        Lọc đánh giá:
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:flex md:gap-x-4">
        {/* Lọc theo Rating */}
        <div className="flex items-center">
          <label htmlFor="rating-filter" className="mr-2 text-sm text-gray-600 flex items-center">
            <FiStar className="mr-1 inline h-4 w-4 text-yellow-500" /> Sao:
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
            <FiImage className="mr-1 inline h-4 w-4 text-gray-500" /> Có hình
            ảnh
          </label>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;
