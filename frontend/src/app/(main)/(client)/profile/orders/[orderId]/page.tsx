"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetOrderById } from "@/lib/react-query/orderQueries";
import OrderDetailsDisplay from "@/components/client/orders/OrderDetailsDisplay";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import { FiLoader, FiAlertCircle } from "react-icons/fi";
import { useEffect } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import type { AxiosError } from "axios";

// export async function generateMetadata({ params }: { params: { orderId: string } }) {
//   // TODO: Fetch order summary or use a generic title
//   return {
//     title: `Chi tiết Đơn hàng #${params.orderId.slice(-6)} | Serein Shop`,
//   };
// }

export default function UserOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId =
    typeof params.orderId === "string" ? params.orderId : undefined;

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useGetOrderById(orderId, {
    enabled: !!orderId, // Chỉ fetch khi có orderId
  });

  useEffect(() => {
    if (!isLoading && isError) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Lỗi tải đơn hàng.";

      toast.error(errorMessage);
      // router.push('/profile/orders');
    }
  }, [isLoading, isError, error, router]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Trang Chủ", href: "/" },
    { label: "Tài khoản", href: "/profile" },
    { label: "Đơn hàng của tôi", href: "/profile/orders" },
    { label: `Đơn hàng #${orderId?.slice(-6).toUpperCase()}`, isCurrent: true },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <FiLoader className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError && !order) {
    // isError có thể true nhưng order vẫn có từ cache
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FiAlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
        <h1 className="mb-2 text-2xl font-semibold text-red-600">
          Không thể tải đơn hàng
        </h1>
        <p className="text-gray-600">
          Đã có lỗi xảy ra hoặc bạn không có quyền xem đơn hàng này.
        </p>
        <Link
          href="/profile/orders"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  if (!order) {
    // Trường hợp không loading, không error nhưng không có order
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FiAlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h1 className="mb-2 text-2xl font-semibold text-gray-700">
          Không tìm thấy đơn hàng
        </h1>
        <p className="text-gray-600">Đơn hàng bạn tìm kiếm không tồn tại.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto px-0 lg:px-10">
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <OrderDetailsDisplay order={order} title="Chi tiết đơn hàng" />
    </div>
  );
}
