"use client";

import { ChangeEvent } from "react";
import { useTranslations } from "next-intl";

interface OrderStatusOption {
  value: string;
  label: string;
}

interface OrderFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (newStatus: string) => void;
  orderStatusOptions: OrderStatusOption[];
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  orderStatusOptions,
}) => {
  const t = useTranslations("OrderFilters");

  return (
    <div className="mb-6 flex justify-start">
      <div className="w-full sm:w-auto sm:max-w-xs">
        <label htmlFor="status-filter" className="sr-only">
          {t("filterByStatus")}
        </label>
        <select
          id="status-filter"
          name="status-filter"
          value={statusFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onStatusFilterChange(e.target.value)
          }
          className="block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {orderStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default OrderFilters;