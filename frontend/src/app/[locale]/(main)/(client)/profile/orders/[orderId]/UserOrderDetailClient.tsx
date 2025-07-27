"use client";

import OrderDetailsDisplay from "@/components/client/orders/OrderDetailsDisplay";
import { Link, useRouter } from "@/i18n/navigation";
import { useGetOrderById } from "@/lib/react-query/orderQueries";
import type { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle, FiLoader } from "react-icons/fi";

interface UserOrderDetailClientProps {
  orderId: string | undefined;
}

export default function UserOrderDetailClient({
  orderId,
}: UserOrderDetailClientProps) {
  const router = useRouter();
  const t = useTranslations("OrderDetailPage");

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useGetOrderById(orderId, {
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!isLoading && isError) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Lỗi tải chi tiết đơn hàng.";
      toast.error(errorMessage, { id: `order-fetch-error-${orderId}` });

      // Nếu lỗi 403 hoặc 404, có thể điều hướng
      if (
        axiosError.response?.status === 404 ||
        axiosError.response?.status === 403
      ) {
        // router.push('/profile/orders'); // Quay lại danh sách đơn hàng
      }
    }
  }, [isLoading, isError, error, router, orderId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <FiLoader className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="ml-3 text-gray-600">{t("loading")}</p>
      </div>
    );
  }

  if (isError && !order) {
    // Chỉ hiển thị lỗi to nếu không có data cũ từ cache
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <FiAlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h2 className="mb-2 text-xl font-semibold text-red-700">
          {t("loadingError")}
        </h2>
        <p className="text-sm text-gray-600">
          {(error as AxiosError<{ message?: string }>)?.response?.data
            ?.message ||
            (error as Error)?.message ||
            "Đã có lỗi xảy ra."}
        </p>
        <Link
          href="/profile/orders"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          {t("backToList")}
        </Link>
      </div>
    );
  }

  if (!order) {
    // Trường hợp enabled = false, hoặc fetch xong nhưng không có data (ví dụ 404)
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-8 text-center">
        <FiAlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold text-yellow-800">
          {t("notFound")}
        </h2>
        <p className="text-sm text-gray-600">{t("notFoundMessage")}</p>
      </div>
    );
  }

  // Nếu có order (kể cả khi isError = true nhưng có data từ cache)
  return (
    <div>
      {isError &&
        order && ( // Hiển thị thông báo lỗi nhỏ nếu có data cũ
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {t("staleDataWarning")}
          </div>
        )}
      <OrderDetailsDisplay order={order} title={t("title")} />
    </div>
  );
}
