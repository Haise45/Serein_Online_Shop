"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FiPackage } from "react-icons/fi";

interface OrderEmptyStateProps {
  statusFilter: string;
  statusLabel?: string;
}

const OrderEmptyState: React.FC<OrderEmptyStateProps> = ({
  statusFilter,
  statusLabel,
}) => {
  const t = useTranslations("OrderEmptyState");

  return (
    <div className="text-center">
      <FiPackage className="mx-auto h-16 w-16 text-gray-300" />
      <h3 className="mt-4 text-lg font-medium text-gray-800">
        {statusFilter
          ? t("noOrdersWithStatus", { status: statusLabel || statusFilter })
          : t("noOrdersYet")}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {statusFilter ? t("tryAnotherStatus") : t("startShoppingPrompt")}
      </p>
      {!statusFilter && (
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {t("startShoppingButton")}
        </Link>
      )}
    </div>
  );
};

export default OrderEmptyState;
