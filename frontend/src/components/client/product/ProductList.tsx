"use client";
import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductListProps {
  title?: string;
  products: Product[];
  loading?: boolean;
  error?: string | null;
}

export default function ProductList({
  title,
  products,
  loading,
  error,
}: ProductListProps) {
  if (loading) {
    return (
      <div className="py-8">
        {title && (
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 italic sm:text-3xl">
            {title}
          </h2>
        )}
        {/* Điều chỉnh grid cho skeleton để khớp với grid sản phẩm thật */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="aspect-square w-full rounded-t-xl bg-gray-300"></div>
              <div className="p-3 sm:p-4">
                {" "}
                {/* Thêm padding cho nội dung skeleton */}
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-300"></div>
                <div className="h-4 w-full rounded bg-gray-300 sm:h-5"></div>
                <div className="mt-2 h-6 w-1/2 rounded bg-gray-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        {title && (
          <h2 className="mb-6 text-2xl font-bold text-gray-800 sm:text-3xl">
            {title}
          </h2>
        )}
        <p className="text-red-500">Lỗi tải sản phẩm: {error}</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-8 text-center">
        {title && (
          <h2 className="mb-6 text-2xl font-bold text-gray-800 sm:text-3xl">
            {title}
          </h2>
        )}
        <p className="text-gray-500">Không tìm thấy sản phẩm nào.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {title && (
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 sm:mb-8 sm:text-3xl">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
