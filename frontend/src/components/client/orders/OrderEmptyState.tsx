"use client";

import Link from "next/link";
import { FiPackage } from "react-icons/fi";

interface OrderEmptyStateProps {
  statusFilter: string;
  statusLabel?: string;
}

const OrderEmptyState: React.FC<OrderEmptyStateProps> = ({
  statusFilter,
  statusLabel,
}) => {
  return (
    <div className="text-center">
      <FiPackage className="mx-auto h-16 w-16 text-gray-300" />
      <h3 className="mt-4 text-lg font-medium text-gray-800">
        {statusFilter
          ? `Không có đơn hàng nào với trạng thái "${statusLabel || statusFilter}"`
          : "Bạn chưa có đơn hàng nào"}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {statusFilter
          ? "Hãy thử chọn trạng thái khác hoặc xem tất cả đơn hàng."
          : "Hãy bắt đầu mua sắm để xem lịch sử đơn hàng của bạn tại đây."}
      </p>
      {!statusFilter && (
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Bắt đầu mua sắm
        </Link>
      )}
    </div>
  );
};

export default OrderEmptyState;