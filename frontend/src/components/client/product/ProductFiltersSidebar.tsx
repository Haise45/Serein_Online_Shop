// src/app/(main)/products/components/ProductFiltersSidebar.tsx
"use client";
import { ProductFilters } from "@/app/(main)/(client)/products/ProductsPageClient";
import { Category } from "@/types/category";
import CategoryFilter from "./CategoryFilter";
import PriceFilter from "./PriceFilter";
import AttributeFilter from "./AttributeFilter";
import RatingFilter from "./RatingFilter"; // Sẽ tạo
import { FiSearch, FiXCircle } from "react-icons/fi";
import { useState, useEffect } from "react";

interface ProductFiltersSidebarProps {
  filters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
  categories: Category[];
  isLoadingCategories: boolean;
  availableAttributes: Record<string, string[]>; // Các giá trị thuộc tính khả dụng
  onSearchChange: (searchTerm: string) => void; // Hàm callback khi tìm kiếm
  currentSearchTerm: string;
  onClearAllFilters: () => void;
}

export default function ProductFiltersSidebar({
  filters,
  onFilterChange,
  categories,
  isLoadingCategories,
  onSearchChange,
  currentSearchTerm,
  onClearAllFilters
}: ProductFiltersSidebarProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(currentSearchTerm);

  useEffect(() => {
    setLocalSearchTerm(currentSearchTerm);
  }, [currentSearchTerm]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearchChange(localSearchTerm);
  };

  const hasActiveFilters =
    Object.keys(filters).some(key => {
        if (key === 'attributes') return Object.keys(filters.attributes || {}).length > 0;
        return filters[key as keyof ProductFilters] !== undefined && filters[key as keyof ProductFilters] !== '';
    }) || currentSearchTerm !== "";


  return (
    <div className="divide-y divide-gray-200">
      {/* Search Input */}
      <div className="pb-6">
        <form onSubmit={handleSearchSubmit} className="relative">
          <label htmlFor="search-filter" className="sr-only">Tìm kiếm sản phẩm</label>
          <input
            type="search"
            name="search-filter"
            id="search-filter"
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, SKU..."
            className="input-field w-full pr-10" // Thêm pr-10 cho nút search
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-400 hover:text-indigo-600"
            aria-label="Tìm kiếm"
          >
            <FiSearch className="h-5 w-5" />
          </button>
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
      />
      <AttributeFilter
        currentFilters={filters}
        onFilterChange={onFilterChange}
        // availableAttributes={availableAttributes} // Truyền xuống nếu dùng
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
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}