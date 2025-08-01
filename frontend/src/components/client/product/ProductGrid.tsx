"use client";
import ProductCard from "@/components/client/product/ProductCard";
import { Attribute, ExchangeRates, Product } from "@/types";
import { FiAlertCircle } from "react-icons/fi";
import PaginationControls from "./PaginationControls";
import SortDropdown from "./SortDropdown";
import { useTranslations } from "next-intl";

interface ProductGridProps {
  products: Product[];
  attributes: Attribute[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (newSortBy: string, newSortOrder: "asc" | "desc") => void;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  onPageChange: (newPage: number) => void;
  limit: number;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

export default function ProductGrid({
  products,
  attributes,
  isLoading,
  isError,
  error,
  sortBy,
  sortOrder,
  onSortChange,
  currentPage,
  totalPages,
  totalProducts,
  onPageChange,
  limit,
  displayCurrency,
  rates,
}: ProductGridProps) {
  const t = useTranslations("ProductPage");

  if (isLoading) {
    // Hiển thị skeleton cho product grid trong khi loading (tương tự skeleton ở page.tsx)
    return (
      <div>
        <div className="mb-6 flex justify-end">
          <div className="h-10 w-48 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(limit)].map(
            (
              _,
              i, // Hiển thị số lượng skeleton bằng limit
            ) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-200 bg-white"
              >
                <div className="aspect-square w-full rounded-t-xl bg-gray-300"></div>
                <div className="p-3 sm:p-4">
                  <div className="mb-2 h-5 w-3/4 rounded bg-gray-300"></div>
                  <div className="h-4 w-full rounded bg-gray-300 sm:h-5"></div>
                  <div className="mt-2 h-6 w-1/2 rounded bg-gray-300"></div>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <FiAlertCircle className="h-12 w-12 text-red-400" />
        <h3 className="mt-4 text-xl font-semibold">
          {t("errorLoadingProducts")}
        </h3>
        <p className="mt-2 text-sm">
          {error?.message || "Đã có lỗi xảy ra. Vui lòng thử lại."}
        </p>
        {/* Có thể thêm nút refetch ở đây nếu query có hàm refetch */}
      </div>
    );
  }

  if (products.length === 0 && !isLoading) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-medium text-gray-700">
          {t("noProductsFound")}
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          {t("noProductsFoundSubtitle")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-600">
          {t.rich("showingResults", {
            from: (currentPage - 1) * limit + 1,
            to: Math.min(currentPage * limit, totalProducts),
            total: totalProducts,
            bold: (chunks) => <span className="font-medium">{chunks}</span>,
          })}
        </p>
        <SortDropdown
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 xl:grid-cols-4">
        {/* Điều chỉnh số cột ở đây cho phù hợp với layout mới (filter sidebar chiếm nhiều hơn) */}
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            attributes={attributes}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        ))}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
