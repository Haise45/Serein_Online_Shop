"use client";

import { useGetProducts } from "@/lib/react-query/productQueries";
import { getAllCategories } from "@/services/categoryService";
import { GetProductsParams } from "@/services/productService";
import { Category } from "@/types/category";
import { PageSearchParams } from "@/types/next";
import { Product } from "@/types/product";
import { useQuery } from "@tanstack/react-query";
import {
  useSearchParams as useNextSearchParamsHook,
  usePathname,
  useRouter,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import MobileFilterButton from "@/components/client/product/MobileFilterButton";
import MobileFilterDrawer from "@/components/client/product/MobileFilterDrawer";
import ProductFiltersSidebar from "@/components/client/product/ProductFiltersSidebar";
import ProductGrid from "@/components/client/product/ProductGrid";
import ActiveFiltersDisplay from "@/components/client/product/ActiveFiltersDisplay";

// Giả sử bạn có hằng số này ở đâu đó, ví dụ: src/constants/pagination.ts
const DEFAULT_PRODUCTS_LIMIT = 12; // Hoặc giá trị bạn muốn

interface ProductsPageClientProps {
  searchParams: PageSearchParams; // Nhận searchParams ban đầu từ server component
}

export interface ProductFilters {
  category?: string; // category slug
  minPrice?: number;
  maxPrice?: number;
  attributes?: Record<string, string[]>; // Ví dụ: { "Màu sắc": ["Đỏ", "Xanh"], "Size": ["M"] }
  minRating?: number;
  // search term được quản lý bởi state `searchTerm` riêng
}

// Hàm helper để parse searchParams thành ProductFilters
const parseSearchParamsToFilters = (
  searchParams: PageSearchParams,
): ProductFilters => {
  const filters: ProductFilters = {};
  if (searchParams?.category && typeof searchParams.category === "string") {
    filters.category = decodeURIComponent(searchParams.category);
  }
  if (searchParams?.minPrice && !isNaN(Number(searchParams.minPrice))) {
    filters.minPrice = Number(searchParams.minPrice);
  }
  if (searchParams?.maxPrice && !isNaN(Number(searchParams.maxPrice))) {
    filters.maxPrice = Number(searchParams.maxPrice);
  }
  if (searchParams?.minRating && !isNaN(Number(searchParams.minRating))) {
    filters.minRating = Number(searchParams.minRating);
  }

  const attrs: Record<string, string[]> = {};
  Object.keys(searchParams).forEach((key) => {
    if (key.startsWith("attributes[")) {
      const attrName = decodeURIComponent(key.substring(11, key.length - 1));
      const value = searchParams[key];
      if (typeof value === "string") {
        attrs[attrName] = value.split(",").map((v) => decodeURIComponent(v));
      } else if (Array.isArray(value)) {
        attrs[attrName] = value.map((v) => decodeURIComponent(v));
      }
    }
  });
  if (Object.keys(attrs).length > 0) filters.attributes = attrs;
  return filters;
};

export default function ProductsPageClient({
  searchParams: initialSearchParams,
}: ProductsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentNextSearchParams = useNextSearchParamsHook(); // Hook để đọc URL hiện tại ở client

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // --- State cho Filters, Sort, Pagination, Search ---
  const [filters, setFilters] = useState<ProductFilters>(() =>
    parseSearchParamsToFilters(initialSearchParams),
  );
  const [sortBy, setSortBy] = useState<string>(
    (initialSearchParams?.sortBy as string) || "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (initialSearchParams?.sortOrder as "asc" | "desc") || "desc",
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(initialSearchParams?.page) || 1,
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    (initialSearchParams?.search as string) || "",
  );

  // Ref để theo dõi và kiểm soát các hiệu ứng cập nhật URL/state
  const isInitialLoadRef = useRef(true); // Đánh dấu lần load đầu tiên
  const previousSearchPathRef = useRef<string>(""); // Lưu trữ search path trước đó

  // Effect 1: Đồng bộ state từ URL khi URL thay đổi (ví dụ: nút back/forward, hoặc load lần đầu với params)
  useEffect(() => {
    const currentSearchPath = currentNextSearchParams.toString();

    // Chỉ chạy nếu search path thực sự thay đổi so với lần trước,
    // và không phải là lần load đầu tiên (vì state đã được init từ initialSearchParams)
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      previousSearchPathRef.current = currentSearchPath; // Lưu lại search path ban đầu
      return;
    }

    if (currentSearchPath !== previousSearchPathRef.current) {
      // console.log("URL changed via browser, syncing state from URL:", currentSearchPath);
      const newFiltersFromUrl = parseSearchParamsToFilters(
        Object.fromEntries(currentNextSearchParams.entries()),
      );
      setFilters(newFiltersFromUrl);
      setSearchTerm(currentNextSearchParams.get("search") || "");
      setCurrentPage(Number(currentNextSearchParams.get("page")) || 1);
      setSortBy(currentNextSearchParams.get("sortBy") || "createdAt");
      setSortOrder(
        (currentNextSearchParams.get("sortOrder") as "asc" | "desc") || "desc",
      );
      previousSearchPathRef.current = currentSearchPath; // Cập nhật search path đã xử lý
    }
  }, [currentNextSearchParams]);

  // Effect 2: Cập nhật URL khi các state (filters, sortBy, etc.) thay đổi từ tương tác người dùng
  useEffect(() => {
    // Không chạy effect này trong lần load đầu tiên nếu state được init từ initialSearchParams
    // và không có sự thay đổi nào từ người dùng ngay lập tức
    if (
      isInitialLoadRef.current &&
      previousSearchPathRef.current === currentNextSearchParams.toString()
    ) {
      return;
    }
    // console.log("State (filters, sort, page, search) changed, attempting to update URL");

    const params = new URLSearchParams();
    if (filters.category)
      params.set("category", encodeURIComponent(filters.category));
    if (filters.minPrice !== undefined)
      params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined)
      params.set("maxPrice", String(filters.maxPrice));
    if (filters.minRating !== undefined)
      params.set("minRating", String(filters.minRating));
    if (searchTerm) params.set("search", encodeURIComponent(searchTerm));

    if (filters.attributes) {
      Object.entries(filters.attributes).forEach(([key, values]) => {
        if (values.length > 0) {
          params.set(
            `attributes[${encodeURIComponent(key)}]`,
            values.map((v) => encodeURIComponent(v)).join(","),
          );
        }
      });
    }

    // Chỉ thêm vào URL nếu khác giá trị mặc định để URL gọn hơn
    const defaultSortBy = "createdAt";
    const defaultSortOrder = "desc";

    if (sortBy !== defaultSortBy || sortOrder !== defaultSortOrder) {
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
    } else if (sortBy !== defaultSortBy) {
      // Trường hợp sortOrder là default nhưng sortBy khác default
      params.set("sortBy", sortBy);
    }

    if (currentPage > 1) {
      params.set("page", String(currentPage));
    }

    const newQueryString = params.toString();

    // Chỉ gọi router.replace nếu query string mới thực sự khác với query string hiện tại trên URL
    // Điều này quan trọng để tránh vòng lặp khi Effect 1 cũng đang chạy
    if (newQueryString !== currentNextSearchParams.toString()) {
      // console.log("Updating URL with new params:", newQueryString);
      router.replace(`${pathname}?${newQueryString}`, { scroll: false });
      previousSearchPathRef.current = newQueryString; // Cập nhật lại ref sau khi chủ động thay đổi URL
    }
  }, [
    filters,
    sortBy,
    sortOrder,
    currentPage,
    searchTerm,
    pathname,
    router,
    currentNextSearchParams,
  ]);

  // --- Fetch Products Data ---
  const queryParams: GetProductsParams = useMemo(() => {
    const attributesForApi: Record<string, string> = {};
    if (filters.attributes) {
      Object.entries(filters.attributes).forEach(([key, valueArray]) => {
        if (valueArray.length > 0) {
          attributesForApi[key] = valueArray.join(",");
        }
      });
    }
    return {
      page: currentPage,
      limit: DEFAULT_PRODUCTS_LIMIT,
      sortBy,
      sortOrder,
      category: filters.category,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      attributes:
        Object.keys(attributesForApi).length > 0 ? attributesForApi : undefined,
      minRating: filters.minRating,
      search: searchTerm || undefined,
    };
  }, [currentPage, sortBy, sortOrder, filters, searchTerm]);

  const {
    data: productData,
    isLoading,
    isError,
    error,
  } = useGetProducts(queryParams, {
    // keepPreviousData: true, // Giữ lại data cũ trong khi data mới đang fetch (tạo UX mượt hơn)
  });

  // --- Fetch Categories Data for Filters ---
  const { data: categories, isLoading: isLoadingCategories } = useQuery<
    Category[],
    Error
  >({
    queryKey: ["allActiveCategoriesForFilter"],
    queryFn: () => getAllCategories({ isActive: true }),
    staleTime: 1000 * 60 * 60,
  });

  // --- Handlers ---
  const handleFilterChange = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback(
    (newSortBy: string, newSortOrder: "asc" | "desc") => {
      setSortBy(newSortBy);
      setSortOrder(newSortOrder);
      setCurrentPage(1);
    },
    [],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    // Tùy chọn: cuộn lên đầu trang
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSearchChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({}); // Reset object filters
    setSearchTerm(""); // Reset search term
    setCurrentPage(1); // Quay về trang 1
    // Các giá trị sort có thể giữ nguyên hoặc reset tùy ý
  }, []);

  // Logic lấy các giá trị thuộc tính để hiển thị trong bộ lọc (cần cải thiện nếu muốn chính xác hơn)
  const availableAttributeFilters = useMemo(() => {
    if (isLoading || !productData?.products) return {}; // Trả về rỗng nếu đang loading hoặc không có product
    const attrs: Record<string, Set<string>> = {};
    productData.products.forEach((p: Product) => {
      p.attributes?.forEach((attr) => {
        if (!attrs[attr.name]) attrs[attr.name] = new Set();
        attr.values.forEach((val) => attrs[attr.name].add(val));
      });
      p.variants?.forEach((v) => {
        v.optionValues.forEach((ov) => {
          if (!attrs[ov.attributeName]) attrs[ov.attributeName] = new Set();
          attrs[ov.attributeName].add(ov.value);
        });
      });
    });
    return Object.fromEntries(
      Object.entries(attrs).map(([key, valueSet]) => [
        key,
        Array.from(valueSet).sort(),
      ]),
    );
  }, [productData?.products, isLoading]);

  return (
    <div>
      <div className="mb-4 lg:hidden">
        <MobileFilterButton
          onClick={() => setIsMobileFilterOpen(true)}
          // Tính toán activeFilterCount
          activeFilterCount={
            Object.values(filters).filter((value) => {
              if (Array.isArray(value)) return value.length > 0; // Cho attributes dạng mảng
              if (typeof value === "object" && value !== null)
                return Object.keys(value).length > 0; // Cho attributes dạng object
              return value !== undefined && value !== "";
            }).length + (searchTerm ? 1 : 0)
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-12">
        <aside className="scrollbar-thin sticky top-20 hidden max-h-[calc(100vh-6rem)] self-start overflow-y-auto pr-2 lg:col-span-3 lg:block xl:col-span-3">
          {/* Sidebar sẽ cuộn độc lập */}
          <ProductFiltersSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categories || []}
            isLoadingCategories={isLoadingCategories}
            availableAttributes={availableAttributeFilters}
            onSearchChange={handleSearchChange}
            currentSearchTerm={searchTerm}
            onClearAllFilters={handleClearAllFilters}
          />
        </aside>

        <main className="lg:col-span-9 xl:col-span-9">
           {/* Hiển thị ActiveFiltersDisplay phía trên ProductGrid */}
          <ActiveFiltersDisplay
            filters={filters}
            searchTerm={searchTerm}
            categories={categories || []} // Cần danh sách categories để lấy tên
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onClearAllFilters={handleClearAllFilters}
          />
          <ProductGrid
            products={productData?.products || []}
            isLoading={isLoading} // Truyền trạng thái loading của products
            isError={isError}
            error={error}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            currentPage={currentPage}
            totalPages={productData?.totalPages || 1}
            totalProducts={productData?.totalProducts || 0}
            onPageChange={handlePageChange}
            limit={productData?.limit || DEFAULT_PRODUCTS_LIMIT}
          />
        </main>
      </div>

      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories || []}
        isLoadingCategories={isLoadingCategories}
        availableAttributes={availableAttributeFilters}
        onSearchChange={handleSearchChange}
        currentSearchTerm={searchTerm}
        onClearAllFilters={handleClearAllFilters}
      />
    </div>
  );
}
