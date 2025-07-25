"use client";
import classNames from "classnames";
import { FiStar } from "react-icons/fi";
import { ProductFilters } from "@/app/[locale]/(main)/(client)/products/ProductsPageClient";
import FilterDisclosure from "./FilterDisclosure";
import { useTranslations } from "next-intl";

interface RatingFilterProps {
  currentFilters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
}

const RATINGS = [5, 4, 3, 2, 1]; // Các mức rating để chọn

export default function RatingFilter({
  currentFilters,
  onFilterChange,
}: RatingFilterProps) {
  const t = useTranslations("ProductFilters");

  const handleRatingSelect = (rating: number) => {
    // Nếu click lại rating đã chọn thì bỏ chọn (reset minRating)
    const newMinRating =
      currentFilters.minRating === rating ? undefined : rating;
    onFilterChange({ ...currentFilters, minRating: newMinRating });
  };

  return (
    <FilterDisclosure title={t("ratingTitle")} defaultOpen={false}>
      {/* Mặc định đóng */}
      <div className="space-y-2">
        {RATINGS.map((rating) => (
          <button
            key={rating}
            onClick={() => handleRatingSelect(rating)}
            className={classNames(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1", // Thêm focus style
              currentFilters.minRating === rating
                ? "bg-indigo-100 font-semibold text-indigo-700" // Nổi bật hơn khi chọn
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
            )}
            aria-pressed={
              currentFilters.minRating === rating ? "true" : "false"
            } // Accessibility
          >
            <span className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={classNames(
                    "h-4 w-4 sm:h-5 sm:w-5", // Kích thước sao
                    i < rating
                      ? "fill-current text-yellow-400"
                      : "text-gray-300",
                  )}
                  aria-hidden="true"
                />
              ))}
            </span>
            <span
              className={classNames({
                "font-semibold": currentFilters.minRating === rating,
              })}
            >
              {t("fromXStars", { count: rating })}
            </span>
          </button>
        ))}
        {currentFilters.minRating !== undefined && ( // Nút xóa filter rating
          <button
            onClick={() =>
              handleRatingSelect(currentFilters.minRating as number)
            } // Click lại để bỏ chọn
            className="mt-2 w-full rounded-md px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
          >
            {t("clearRatingFilter")}
          </button>
        )}
      </div>
    </FilterDisclosure>
  );
}
