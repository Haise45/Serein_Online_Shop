"use client";

import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { FiCheckCircle } from "react-icons/fi";
import { useTranslations } from "next-intl";

export default function OrderSuccessPage() {
  const t = useTranslations("OrderSuccessPage");
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <FiCheckCircle className="mx-auto mb-6 h-20 w-20 text-green-500" />
      <h1 className="text-3xl font-bold text-gray-800">{t("title")}</h1>
      {orderId && (
        <p className="mt-3 text-lg text-gray-600">
          {t.rich("orderCode", {
            code: orderId.toString().slice(-6).toUpperCase(),
            bold: (chunks) => (
              <span className="font-semibold text-indigo-600">{chunks}</span>
            ),
          })}
        </p>
      )}
      <p className="mt-2 text-gray-500">
        {t("thankYou")}
      </p>
      <p className="mt-1 text-gray-500">
        {t("emailConfirmation")}
      </p>
      <div className="mt-8 space-x-4">
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        >
          {t("continueShopping")}
        </Link>
        {/* Nếu có cách lấy lại orderId và tracking token ở đây, có thể thêm link theo dõi */}
      </div>
    </div>
  );
}
