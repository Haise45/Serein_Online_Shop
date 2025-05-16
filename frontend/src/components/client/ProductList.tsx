// src/components/client/ProductList.tsx
"use client";
import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductListProps {
  title?: string; // Tiêu đề cho section (ví dụ: "Sản Phẩm Mới Nhất")
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
    // Hiển thị skeleton loading
    return (
      <div className="py-8">
        {title && (
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 sm:text-3xl">
            {title}
          </h2>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(4)].map(
            (
              _,
              i, // Hiển thị 4 skeleton cards
            ) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-gray-200 p-4"
              >
                <div className="aspect-w-1 aspect-h-1 mb-3 rounded bg-gray-300"></div>
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-300"></div>
                <div className="h-6 w-1/2 rounded bg-gray-300"></div>
              </div>
            ),
          )}
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
