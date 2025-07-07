"use client";

import { ProductFilters } from "@/app/[locale]/(main)/(client)/products/ProductsPageClient";
import { Category } from "@/types/category"; // Cần Category để lấy tên từ slug
import { formatCurrency } from "@/lib/utils"; // Giả sử bạn có hàm này
import { FiX } from "react-icons/fi";
import { ExchangeRates } from "@/types";
import { useTranslations } from "next-intl";

interface ActiveFiltersDisplayProps {
  filters: ProductFilters;
  searchTerm: string;
  categories: Category[]; // Danh sách tất cả categories để tra cứu tên từ slug
  onFilterChange: (newFilters: ProductFilters) => void;
  onSearchChange: (searchTerm: string) => void;
  onClearAllFilters: () => void; // Hàm để xóa tất cả filter
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

interface FilterTag {
  type: keyof ProductFilters | "search" | "rating"; // Thêm "rating"
  keyDisplay: string; // Tên hiển thị của filter (ví dụ: "Danh mục")
  valueDisplay: string; // Giá trị hiển thị (ví dụ: "Áo Thun")
  onRemove: () => void; // Hàm để xóa filter này
}

export default function ActiveFiltersDisplay({
  filters,
  searchTerm,
  categories,
  onFilterChange,
  onSearchChange,
  onClearAllFilters,
  displayCurrency,
  rates,
}: ActiveFiltersDisplayProps) {
  const t = useTranslations("ProductPage");
  const f = useTranslations("ProductFilters");
  const activeFilterTags: FilterTag[] = [];
  const currencyOptions = { currency: displayCurrency, rates };

  // 1. Search Term
  if (searchTerm) {
    activeFilterTags.push({
      type: "search",
      keyDisplay: f("searchLabel"),
      valueDisplay: searchTerm,
      onRemove: () => onSearchChange(""),
    });
  }

  // 2. Category
  if (filters.category) {
    const categoryName =
      categories.find((cat) => cat.slug === filters.category)?.name ||
      filters.category;
    activeFilterTags.push({
      type: "category",
      keyDisplay: f("categoryTitle"),
      valueDisplay: categoryName,
      onRemove: () => onFilterChange({ ...filters, category: undefined }),
    });
  }

  // 3. Price Range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    let priceDisplay = "";
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      priceDisplay = `${formatCurrency(filters.minPrice, currencyOptions)} - ${formatCurrency(filters.maxPrice, currencyOptions)}`;
    } else if (filters.minPrice !== undefined) {
      priceDisplay = `${f("fromPlaceholder")} ${formatCurrency(filters.minPrice, currencyOptions)}`;
    } else if (filters.maxPrice !== undefined) {
      priceDisplay = `${f("toPlaceholder")} ${formatCurrency(filters.maxPrice, currencyOptions)}`;
    }
    if (priceDisplay) {
      activeFilterTags.push({
        type: "minPrice", // Hoặc "maxPrice", không quan trọng lắm vì xóa cả hai
        keyDisplay: f("priceTitle"),
        valueDisplay: priceDisplay,
        onRemove: () =>
          onFilterChange({
            ...filters,
            minPrice: undefined,
            maxPrice: undefined,
          }),
      });
    }
  }

  // 4. Attributes (Màu sắc, Kích cỡ, etc.)
  if (filters.attributes) {
    Object.entries(filters.attributes).forEach(([key, values]) => {
      if (values && values.length > 0) {
        values.forEach((value) => {
          activeFilterTags.push({
            type: "attributes",
            keyDisplay: key, // Tên thuộc tính (Màu sắc, Kích cỡ)
            valueDisplay: value, // Giá trị thuộc tính (Đỏ, M)
            onRemove: () => {
              // Lấy mảng giá trị hiện tại của thuộc tính này
              const currentValuesForAttribute = filters.attributes?.[key] || [];
              // Tạo mảng mới không chứa giá trị đang bị xóa
              const newAttributeValues = currentValuesForAttribute.filter(
                (v) => v !== value,
              );

              // Tạo bản sao của object attributes hiện tại
              const updatedAttributes = { ...(filters.attributes || {}) };

              if (newAttributeValues.length > 0) {
                updatedAttributes[key] = newAttributeValues;
              } else {
                // Nếu không còn giá trị nào, xóa key thuộc tính đó
                delete updatedAttributes[key];
              }
              onFilterChange({
                ...filters,
                attributes:
                  Object.keys(updatedAttributes).length > 0
                    ? updatedAttributes
                    : undefined,
              });
            },
          });
        });
      }
    });
  }

  // 5. Rating
  if (filters.minRating !== undefined && filters.minRating > 0) {
    activeFilterTags.push({
      type: "rating",
      keyDisplay: f("ratingTitle"),
      valueDisplay: f("fromXStars", { count: filters.minRating }),
      onRemove: () => onFilterChange({ ...filters, minRating: undefined }),
    });
  }

  if (activeFilterTags.length === 0) {
    return null; // Không hiển thị gì nếu không có filter nào active
  }

  return (
    <div className="mb-4 pt-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium text-gray-700">
          {t("activeFiltersLabel")}
        </span>
        {activeFilterTags.map((tag, index) => (
          <span
            key={`${tag.type}-${tag.keyDisplay}-${tag.valueDisplay}-${index}`} // Key phức tạp hơn để đảm bảo duy nhất
            className="inline-flex items-center rounded-full bg-indigo-100 py-1 pr-1 pl-2.5 text-xs font-medium text-indigo-700"
          >
            {tag.type !== "search" && (
              <span className="mr-1.5 font-normal text-indigo-500">
                {tag.keyDisplay}:
              </span>
            )}
            {tag.valueDisplay}
            <button
              type="button"
              onClick={tag.onRemove}
              className="ml-1.5 inline-flex flex-shrink-0 rounded-full p-0.5 text-indigo-500 hover:bg-indigo-200 hover:text-indigo-600 focus:bg-indigo-500 focus:text-white focus:outline-none"
              aria-label={t("removeFilterAriaLabel", {
                keyDisplay: tag.keyDisplay,
                valueDisplay: tag.valueDisplay,
              })}
            >
              <FiX className="h-3 w-3" />
            </button>
          </span>
        ))}
        {activeFilterTags.length > 1 && ( // Chỉ hiển thị nút "Xóa tất cả" nếu có nhiều hơn 1 tag filter
          <button
            onClick={onClearAllFilters}
            className="ml-2 text-xs text-gray-500 hover:text-red-600 hover:underline"
          >
            {t("clearAllButton")}
          </button>
        )}
      </div>
    </div>
  );
}
