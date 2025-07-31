"use client";

import OrderDetailsDisplay from "@/components/client/orders/OrderDetailsDisplay";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { useGetGuestOrderByToken } from "@/lib/react-query/orderQueries";
import { BreadcrumbItem } from "@/types";
import type { AxiosError } from "axios";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { useTranslations } from "next-intl";

export default function GuestTrackOrderPage() {
  const t = useTranslations("GuestTrackOrderPage");
  const b = useTranslations("Breadcrumbs");

  const params = useParams();
  const orderId =
    typeof params.orderId === "string" ? params.orderId : undefined;
  const token = typeof params.token === "string" ? params.token : undefined;

  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useGetGuestOrderByToken(orderId, token, {
    enabled: !!orderId && !!token,
  });

  useEffect(() => {
    if (!isLoading && isError) {
      const axiosError = error as AxiosError<{ message?: string }>;

      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Lỗi tải đơn hàng.";

      toast.error(errorMessage);
    }
  }, [isLoading, isError, error]);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: b("home"), href: "/" },
    { label: t("title"), isCurrent: true },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <FiLoader className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FiAlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
        <h1 className="mb-2 text-2xl font-semibold text-red-600">
          {t("errorTitle")}
        </h1>
        <p className="text-gray-600">
          {t("errorMessage")}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto px-0 lg:px-10">
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <OrderDetailsDisplay order={order} title={t("title")}/>
    </div>
  );
}
