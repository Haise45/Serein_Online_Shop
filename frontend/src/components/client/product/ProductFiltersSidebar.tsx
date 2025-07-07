"use client";
import { ProductFilters } from "@/app/[locale]/(main)/(client)/products/ProductsPageClient";
import SearchSuggestionList from "@/components/shared/SearchSuggestionList";
import useDebounce from "@/hooks/useDebounce";
import { useGetProducts } from "@/lib/react-query/productQueries";
import { GetProductsParams } from "@/services/productService";
import { Attribute, ExchangeRates } from "@/types";
import { Category } from "@/types/category";
import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiXCircle } from "react-icons/fi";
import AttributeFilter from "./AttributeFilter";
import CategoryFilter from "./CategoryFilter";
import PriceFilter from "./PriceFilter";
import RatingFilter from "./RatingFilter";
import { useTranslations } from "next-intl";

interface ProductFiltersSidebarProps {
  filters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
  categories: Category[];
  isLoadingCategories: boolean;
  attributes: Attribute[];
  isLoadingAttributes: boolean;
  onSearchChange: (searchTerm: string) => void; // Hàm callback khi tìm kiếm
  currentSearchTerm: string;
  onClearAllFilters: () => void;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

export default function ProductFiltersSidebar({
  filters,
  onFilterChange,
  categories,
  isLoadingCategories,
  attributes,
  isLoadingAttributes,
  onSearchChange,
  currentSearchTerm,
  onClearAllFilters,
  displayCurrency,
  rates,
}: ProductFiltersSidebarProps) {
  const t = useTranslations("ProductFilters");
  const [localSearchTerm, setLocalSearchTerm] = useState(currentSearchTerm);

  // === LOGIC GỢI Ý TÌM KIẾM ===
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);
  const [isSuggestionBoxOpen, setIsSuggestionBoxOpen] = useState(false);

  const searchSuggestionParams: GetProductsParams = useMemo(
    () => ({
      search: debouncedSearchTerm,
      limit: 5, // Hiển thị 5 gợi ý trong sidebar
    }),
    [debouncedSearchTerm],
  );

  const { data: suggestedProductsData, isLoading: isLoadingSuggestions } =
    useGetProducts(searchSuggestionParams, {
      enabled:
        !!debouncedSearchTerm &&
        debouncedSearchTerm.length > 1 &&
        isSuggestionBoxOpen,
    });
  const suggestedProducts = suggestedProductsData?.products || [];
  // === KẾT THÚC LOGIC GỢI Ý TÌM KIẾM ===

  useEffect(() => {
    setLocalSearchTerm(currentSearchTerm);
  }, [currentSearchTerm]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearchChange(localSearchTerm);
    setIsSuggestionBoxOpen(false);
  };

  const handleViewAll = () => {
    onSearchChange(localSearchTerm);
    setIsSuggestionBoxOpen(false);
  };

  const hasActiveFilters =
    Object.keys(filters).some((key) => {
      if (key === "attributes")
        return Object.keys(filters.attributes || {}).length > 0;
      return (
        filters[key as keyof ProductFilters] !== undefined &&
        filters[key as keyof ProductFilters] !== ""
      );
    }) || currentSearchTerm !== "";

  return (
    <div className="divide-y divide-gray-200">
      {/* Search Input */}
      <div className="pb-6">
        <form onSubmit={handleSearchSubmit} className="relative">
          <label htmlFor="search-filter" className="sr-only">
            {t("searchLabel")}
          </label>
          <input
            type="search"
            name="search-filter"
            id="search-filter"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            onFocus={() => setIsSuggestionBoxOpen(true)}
            placeholder={t("searchPlaceholder")}
            className="input-field w-full bg-white pr-10"
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-400 hover:text-indigo-600"
            aria-label={t("searchButtonLabel")}
          >
            <FiSearch className="h-5 w-5" />
          </button>
          {isSuggestionBoxOpen && debouncedSearchTerm.length > 1 && (
            <div className="absolute top-full left-0 z-10 mt-2 w-full rounded-md border border-gray-400 bg-white shadow-lg">
              <SearchSuggestionList
                suggestions={suggestedProducts}
                isLoading={isLoadingSuggestions}
                searchTerm={debouncedSearchTerm}
                onSuggestionClick={() => setIsSuggestionBoxOpen(false)}
                onViewAllClick={handleViewAll}
              />
            </div>
          )}
        </form>
      </div>

      <CategoryFilter
        categories={categories}
        isLoading={isLoadingCategories}
        currentFilters={filters}
        onFilterChange={onFilterChange}
      />
      <PriceFilter
        currentFilters={filters}
        onFilterChange={onFilterChange}
        displayCurrency={displayCurrency}
        rates={rates}
      />
      <AttributeFilter
        currentFilters={filters}
        onFilterChange={onFilterChange}
        attributes={attributes}
        isLoading={isLoadingAttributes}
      />
      <RatingFilter // Sẽ tạo component này
        currentFilters={filters}
        onFilterChange={onFilterChange}
      />

      {/* Nút xóa bộ lọc */}
      {hasActiveFilters && (
        <div className="pt-6">
          <button
            onClick={onClearAllFilters}
            className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <FiXCircle className="mr-2 h-4 w-4 text-gray-400" />
            {t("clearAllFiltersButton")}
          </button>
        </div>
      )}
    </div>
  );
}
