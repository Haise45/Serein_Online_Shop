import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutPageClient from "./CheckoutPageClient";

export const metadata: Metadata = {
  title: "Thanh Toán | Serein Shop",
  description: "Hoàn tất thông tin đặt hàng của bạn tại Serein Shop.",
};

// Skeleton Loading cho trang Checkout
function CheckoutLoadingSkeleton() {
  return (
    <div className="mt-8 grid animate-pulse grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
      {/* Phần Form (trái) */}
      <div className="space-y-8 lg:col-span-7 xl:col-span-8">
        {/* Section Thông tin liên hệ (cho guest) */}
        <div className="space-y-3">
          <div className="h-6 w-1/3 rounded bg-gray-300"></div>
          <div className="h-12 rounded bg-gray-200"></div>
        </div>
        {/* Section Địa chỉ */}
        <div className="space-y-3">
          <div className="h-6 w-1/2 rounded bg-gray-300"></div>
          {[...Array(1)].map((_, i) => (
            <div key={i} className="h-20 space-y-2 rounded bg-gray-200 p-4">
              <div className="h-4 w-3/4 rounded bg-gray-300"></div>
              <div className="h-3 w-full rounded bg-gray-300"></div>
            </div>
          ))}
          <div className="h-10 w-1/3 rounded bg-gray-200"></div>
        </div>
        {/* Section Phương thức thanh toán */}
        <div className="space-y-3">
          <div className="h-6 w-2/5 rounded bg-gray-300"></div>
          <div className="h-16 rounded bg-gray-200"></div>
          <div className="h-16 rounded bg-gray-200"></div>
        </div>
        {/* Section Ghi chú */}
        <div className="space-y-2">
          <div className="h-6 w-1/4 rounded bg-gray-300"></div>
          <div className="h-20 rounded bg-gray-200"></div>
        </div>
        {/* Nút Đặt hàng */}
        <div className="mt-6 h-12 w-full rounded bg-gray-300"></div>
      </div>

      {/* Phần Tóm tắt đơn hàng (phải) */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="sticky top-20 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-6 h-8 w-3/4 rounded bg-gray-300"></div>
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="flex items-center border-b border-gray-200 py-4"
            >
              <div className="mr-4 h-16 w-16 rounded bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full rounded bg-gray-300"></div>
                <div className="h-3 w-1/2 rounded bg-gray-300"></div>
              </div>
              <div className="h-4 w-1/4 rounded bg-gray-300"></div>
            </div>
          ))}
          <div className="mt-6 space-y-3">
            <div className="flex h-5 justify-between">
              <div className="w-1/3 rounded bg-gray-200"></div>
              <div className="w-1/4 rounded bg-gray-200"></div>
            </div>
            <div className="flex h-5 justify-between">
              <div className="w-1/3 rounded bg-gray-200"></div>
              <div className="w-1/4 rounded bg-gray-200"></div>
            </div>
            <div className="flex h-6 justify-between border-t border-gray-200 pt-3">
              <div className="w-1/3 rounded bg-gray-300"></div>
              <div className="w-1/4 rounded bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function CheckoutPageContainer() {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Trang Chủ", href: "/" },
    { label: "Giỏ Hàng", href: "/cart" },
    { label: "Thanh Toán", isCurrent: true },
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <Suspense fallback={<CheckoutLoadingSkeleton />}>
        <CheckoutPageClient />
      </Suspense>
    </div>
  );
}
