import PageHeader from "@/components/shared/PageHeader";
import { PageSearchParams } from "@/types/next";
import type { Metadata } from "next";
import { Suspense } from "react";
import UserOrdersClient from "./UserOrdersClient";

export const metadata: Metadata = {
  title: "Lịch Sử Đơn Hàng | Serein Shop",
  description: "Xem lại các đơn hàng bạn đã đặt tại Serein Shop.",
};

// Interface cho searchParams của trang này (chủ yếu là 'page' cho phân trang)
interface UserOrdersPageProps {
  searchParams: Promise<PageSearchParams>;
}

function OrdersLoadingSkeleton() {
  return (
    <div className="mt-6 animate-pulse space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg bg-white p-4 shadow-md sm:p-6">
          <div className="mb-3 flex flex-col items-start justify-between sm:flex-row sm:items-center">
            <div className="mb-2 space-y-1 sm:mb-0">
              <div className="h-5 w-32 rounded bg-gray-300"></div>
              <div className="h-4 w-40 rounded bg-gray-200"></div>
            </div>
            <div className="h-6 w-24 rounded bg-gray-300"></div>
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="h-16 w-full rounded bg-gray-200"></div>{" "}
            {/* Placeholder for items */}
          </div>
          <div className="mt-4 flex justify-end">
            <div className="h-8 w-28 rounded bg-gray-300"></div>
          </div>
        </div>
      ))}
      <div className="mt-8 flex justify-center">
        <div className="h-10 w-64 rounded bg-gray-200"></div>
      </div>
    </div>
  );
}

export default async function UserOrdersPage({
  searchParams,
}: UserOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <div>
      <PageHeader
        title="Lịch sử đơn hàng"
        description="Theo dõi và quản lý tất cả các đơn hàng bạn đã đặt."
      />
      <Suspense fallback={<OrdersLoadingSkeleton />}>
        <UserOrdersClient searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  );
}
