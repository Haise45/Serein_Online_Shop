import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import { PageSearchParams } from "@/types/next";
import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsPageClient from "./ProductsPageClient";

export const metadata: Metadata = {
  title: "Tất Cả Sản Phẩm | Serein Shop",
  description: "Khám phá bộ sưu tập sản phẩm đa dạng tại Serein Shop.",
};

// Interface cho searchParams của trang này
interface ProductsPageProps {
  searchParams: Promise<PageSearchParams>; // Sử dụng PageSearchParams
}

export default async function ProductsPageContainer({
  searchParams,
}: ProductsPageProps) {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Trang Chủ", href: "/" },
    { label: "Sản Phẩm", isCurrent: true },
  ];

  // Truyền searchParams ban đầu xuống client component
  const sp = await searchParams;

  // Client component sẽ sử dụng chúng để khởi tạo state và fetch dữ liệu
  return (
    <div className="mx-auto px-0 lg:px-10">
      <div className="mb-4 sm:mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      {/* Suspense để xử lý loading nếu ProductsPageClient fetch dữ liệu */}
      <Suspense fallback={<ProductsPageLoadingSkeleton />}>
        <ProductsPageClient searchParams={sp} />
      </Suspense>
    </div>
  );
}

// Skeleton component cho loading (ví dụ đơn giản)
function ProductsPageLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-12">
      {/* Skeleton cho Filter Sidebar */}
      <div className="hidden lg:col-span-3 lg:block">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-3 h-6 w-3/4 rounded bg-gray-200"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 w-full rounded bg-gray-200"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Skeleton cho Product Grid */}
      <div className="lg:col-span-9">
        <div className="mb-6 h-10 w-48 animate-pulse rounded bg-gray-200"></div>{" "}
        {/* Sort dropdown skeleton */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <div className="h-10 w-64 animate-pulse rounded bg-gray-200"></div>{" "}
          {/* Pagination skeleton */}
        </div>
      </div>
    </div>
  );
}
