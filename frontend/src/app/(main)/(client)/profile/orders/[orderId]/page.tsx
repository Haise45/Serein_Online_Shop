import type { Metadata } from "next";
import { Suspense } from "react";
import UserOrderDetailClient from "./UserOrderDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}): Promise<Metadata> {
  const { orderId } = await params; // Await params trước khi sử dụng
  const orderIdSuffix = orderId.toString().slice(-6).toUpperCase();
  return {
    title: `Chi tiết Đơn hàng #${orderIdSuffix} | Serein Shop`,
    description: `Xem chi tiết đơn hàng #${orderIdSuffix} của bạn tại Serein Shop.`,
  };
}

interface UserOrderDetailPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

function OrderDetailLoadingSkeleton() {
  return (
    <div className="mt-6 animate-pulse rounded-lg bg-white p-6 shadow-xl sm:p-8 lg:p-10">
      {/* Title Skeleton */}
      <div className="mb-8 text-center">
        <div className="mx-auto h-8 w-3/4 rounded bg-gray-300"></div>
        <div className="mx-auto mt-2 h-4 w-1/2 rounded bg-gray-200"></div>
      </div>
      {/* Stepper Skeleton */}
      <div className="my-6 h-20 rounded bg-gray-200 sm:my-8"></div>
      {/* Info Grid Skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2 md:col-span-1">
            <div className="mb-3 h-6 w-1/2 rounded bg-gray-300"></div>
            <div className="h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-full rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
      {/* Items Skeleton */}
      <div className="mt-8 sm:mt-10">
        <div className="mb-4 h-6 w-1/3 rounded bg-gray-300"></div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex border-t border-gray-200 py-4">
              <div className="mr-4 h-20 w-20 rounded bg-gray-200 sm:h-24 sm:w-24"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 w-full rounded bg-gray-300"></div>
                <div className="h-4 w-3/4 rounded bg-gray-300"></div>
                <div className="h-4 w-1/2 rounded bg-gray-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Summary Skeleton */}
      <div className="mt-8 sm:mt-10">
        <div className="space-y-3 rounded-lg bg-gray-50 p-6">
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
  );
}

export default async function UserOrderDetailPageContainer({
  params,
}: UserOrderDetailPageProps) {
  const { orderId } = await params;

  return (
    <div>
      <Suspense fallback={<OrderDetailLoadingSkeleton />}>
        <UserOrderDetailClient orderId={orderId} />
      </Suspense>
    </div>
  );
}
