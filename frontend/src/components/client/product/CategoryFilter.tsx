// src/app/(main)/products/components/filters/CategoryFilter.tsx
"use client";
import { Category } from '@/types/category';
import { ProductFilters } from "@/app/(main)/(client)/products/ProductsPageClient";
import FilterDisclosure from './FilterDisclosure';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import classNames from 'classnames';

interface CategoryFilterProps {
  categories: Category[];
  isLoading: boolean;
  currentFilters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
}

export default function CategoryFilter({ categories, isLoading, currentFilters, onFilterChange }: CategoryFilterProps) {
  const pathname = usePathname(); // Để tạo link giữ nguyên các filter khác

  const handleCategorySelect = (categorySlug: string | undefined) => {
    onFilterChange({ ...currentFilters, category: categorySlug });
  };

  // Hàm tạo URL giữ lại các filter khác ngoài category
  const createCategoryLink = (slug?: string) => {
    const params = new URLSearchParams();
    // Thêm các filter hiện tại (trừ category) vào params
    if (currentFilters.minPrice) params.set('minPrice', String(currentFilters.minPrice));
    if (currentFilters.maxPrice) params.set('maxPrice', String(currentFilters.maxPrice));
    if (currentFilters.minRating) params.set('minRating', String(currentFilters.minRating));
    if (currentFilters.attributes) {
        Object.entries(currentFilters.attributes).forEach(([key, values]) => {
            if (values.length > 0) params.set(`attributes[${key}]`, values.map(v => encodeURIComponent(v)).join(','));
        });
    }
    // Thêm category mới (nếu có)
    if (slug) {
        params.set('category', slug);
    }
    return `${pathname}?${params.toString()}`;
  }


  if (isLoading) {
    return (
      <FilterDisclosure title="Danh mục" defaultOpen={true}>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-5 w-3/4 rounded bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      </FilterDisclosure>
    );
  }

  // Xây dựng cây danh mục (ví dụ đơn giản, bạn có thể làm phức tạp hơn)
  const buildCategoryTree = (parentId: string | null = null): Category[] => {
    return categories
      .filter(cat => (cat.parent ? (typeof cat.parent === 'string' ? cat.parent : cat.parent._id.toString()) : null) === parentId)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(cat._id.toString())
      }));
  };

  const categoryTree = buildCategoryTree();

  const renderCategoryList = (cats: Category[], level = 0) => (
    <ul className={classNames("space-y-1", { "pl-4": level > 0 })}>
      {cats.map(cat => (
        <li key={cat._id.toString()}>
          <Link
            href={createCategoryLink(cat.slug)}
            onClick={(e) => {
                e.preventDefault(); // Ngăn điều hướng mặc định
                handleCategorySelect(currentFilters.category === cat.slug ? undefined : cat.slug);
            }}
            className={classNames(
              "block px-2 py-1.5 text-sm rounded-md transition-colors",
              currentFilters.category === cat.slug
                ? "bg-indigo-100 text-indigo-700 font-medium"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {cat.name}
          </Link>
          {cat.children && cat.children.length > 0 && renderCategoryList(cat.children as Category[], level + 1)}
        </li>
      ))}
    </ul>
  );


  return (
    <FilterDisclosure title="Danh mục" defaultOpen={true}>
        <div className="space-y-2">
            <Link
                 href={createCategoryLink(undefined)} // Link xóa filter category
                 onClick={(e) => {
                    e.preventDefault();
                    handleCategorySelect(undefined);
                }}
                className={classNames(
                    "block px-2 py-1.5 text-sm rounded-md transition-colors font-medium",
                    !currentFilters.category
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
            >
                Tất cả danh mục
            </Link>
            {renderCategoryList(categoryTree)}
        </div>

    </FilterDisclosure>
  );
}