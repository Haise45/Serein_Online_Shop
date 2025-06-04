// src/app/(main)/profile/vouchers/page.tsx
import PageHeader from "@/components/shared/PageHeader";
import type { Metadata } from "next";
import { Suspense } from "react";
import UserVouchersClient from "./UserVouchersClient";

export const metadata: Metadata = {
  title: "Ví Voucher | Serein Shop",
  description: "Xem và quản lý các mã giảm giá và voucher của bạn.",
};

function VouchersLoadingSkeleton() {
  return (
    <div className="mt-6 grid animate-pulse grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border-l-4 border-indigo-400 bg-white p-5 shadow-lg"
        >
          <div className="mb-2 h-6 w-1/2 rounded bg-gray-300"></div>
          <div className="mb-1 h-4 w-full rounded bg-gray-200"></div>
          <div className="mb-3 h-4 w-3/4 rounded bg-gray-200"></div>
          <div className="mb-1 h-3 w-1/3 rounded bg-gray-200"></div>
          <div className="h-3 w-1/2 rounded bg-gray-200"></div>
          <div className="mt-4 ml-auto h-8 w-24 rounded bg-gray-300"></div>
        </div>
      ))}
    </div>
  );
}

export default function UserVouchersPage() {
  return (
    <div>
      <PageHeader
        title="Ví Voucher của bạn"
        description="Khám phá các ưu đãi và mã giảm giá đang chờ bạn sử dụng."
      />
      <Suspense fallback={<VouchersLoadingSkeleton />}>
        <UserVouchersClient />
      </Suspense>
    </div>
  );
}
