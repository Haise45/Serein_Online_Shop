"use client";

import { useSettings } from "@/app/SettingsContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderSummary } from "@/types/order_model";
import Image from "next/image";
import Link from "next/link";
import {
  FiCalendar,
  FiCheck,
  FiChevronRight,
  FiDollarSign,
  FiLoader,
  FiPackage,
  FiRotateCcw,
  FiXCircle,
} from "react-icons/fi";
import { useTranslations } from "next-intl";

interface OrderRowProps {
  order: OrderSummary;
  onMarkAsDelivered?: (orderId: string) => void;
  isMarkingDelivered: boolean;
  currentMarkingDeliveredId: string | null;
  openRequestModal: (orderId: string, type: "cancellation" | "refund") => void;
}

const OrderRow: React.FC<OrderRowProps> = ({
  order,
  onMarkAsDelivered,
  isMarkingDelivered,
  currentMarkingDeliveredId,
  openRequestModal,
}) => {
  // *** LẤY THÔNG TIN TIỀN TỆ TRONG COMPONENT CON ***
  const { displayCurrency, rates } = useSettings();
  const currencyOptions = { currency: displayCurrency, rates };
  const t = useTranslations("OrderRow");
  const tStatus = useTranslations("OrderStatus");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-cyan-100 text-cyan-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "refunded":
        return "bg-red-100 text-red-800";
      case "cancellationrequested":
      case "refundrequested":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusLabel = tStatus(order.status);

  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const now = new Date();

  const canMarkAsDelivered = order.status === "Shipped";
  const canRequestCancellation = ["Pending", "Processing"].includes(
    order.status,
  );
  const canRequestRefund =
    order.status === "Delivered" &&
    deliveredAt &&
    (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24) <= 14;

  // Kiểm tra xem hành động loading có phải cho đơn hàng này không
  const isCurrentActionLoading =
    isMarkingDelivered && currentMarkingDeliveredId === order._id.toString();

  return (
    <li className="rounded-lg bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
      {/* Thay vì Link bao toàn bộ, chỉ link phần tiêu đề và nút "Xem chi tiết"
          Điều này giúp các nút action bên dưới hoạt động độc lập dễ hơn.
          Nếu bạn vẫn muốn toàn bộ là link, cần cẩn thận với event propagation của các nút.
      */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <div className="mb-3 sm:mb-0">
            <Link
              href={`/profile/orders/${order._id.toString()}`}
              className="group"
            >
              <p className="flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-500">
                <FiPackage className="mr-2 h-4 w-4 text-indigo-500" />
                {t("orderCode", {
                  code: order._id.toString().slice(-6).toUpperCase(),
                })}
              </p>
            </Link>
            <p className="mt-1 flex items-center text-xs text-gray-500">
              <FiCalendar className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
              {t("orderDate", { date: formatDate(order.createdAt) })}
            </p>
          </div>
          <div
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(order.status.toLowerCase())}`}
          >
            {statusLabel}
          </div>
        </div>

        <div className="mt-3 border-t border-gray-200 pt-3">
          {order.orderItems && order.orderItems.length > 0 && (
            <div className="mb-2 flex items-center text-xs text-gray-600">
              <Image
                src={order.orderItems[0].image || "/placeholder-image.jpg"}
                alt={order.orderItems[0].name}
                width={40}
                height={40}
                quality={100}
                className="mr-3 h-10 w-10 flex-shrink-0 rounded border object-cover object-top"
              />
              <span className="flex-1 truncate">
                {order.orderItems[0].name}
                {order.orderItems.length > 1 &&
                  ` ${t("andXMoreProducts", { count: order.orderItems.length - 1 })}`}
              </span>
            </div>
          )}
          <div className="flex flex-col text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center text-gray-700">
              <FiDollarSign className="mr-1.5 h-4 w-4 text-gray-400" />
              {t("totalAmount")}{" "}
              <span className="ml-1 font-semibold">
                {formatCurrency(order.totalPrice, currencyOptions)}
              </span>
            </p>
            <Link
              href={`/profile/orders/${order._id.toString()}`}
              className="mt-2 inline-flex items-center font-medium text-indigo-600 hover:text-indigo-500 sm:mt-0"
            >
              {t("viewDetails")}
              <FiChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Nút Actions */}
        {(canMarkAsDelivered || canRequestCancellation || canRequestRefund) && (
          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
            {canMarkAsDelivered && onMarkAsDelivered && (
              <button
                onClick={() => onMarkAsDelivered(order._id.toString())}
                disabled={isCurrentActionLoading}
                className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus-visible:outline-offset-2 focus-visible:outline-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isCurrentActionLoading ? (
                  <FiLoader className="mr-2 -ml-0.5 h-4 w-4 animate-spin" />
                ) : (
                  <FiCheck className="mr-2 -ml-0.5 h-4 w-4" />
                )}
                {t("markAsReceived")}
              </button>
            )}
            {canRequestCancellation && (
              <button
                onClick={() =>
                  openRequestModal(order._id.toString(), "cancellation")
                }
                disabled={isCurrentActionLoading} // Disable nếu có action khác trên đơn hàng này đang chạy
                className="inline-flex items-center rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-orange-600 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <FiXCircle className="mr-2 -ml-0.5 h-4 w-4" />
                {t("requestCancellation")}
              </button>
            )}
            {canRequestRefund && (
              <button
                onClick={() => openRequestModal(order._id.toString(), "refund")}
                disabled={isCurrentActionLoading} // Disable nếu có action khác trên đơn hàng này đang chạy
                className="inline-flex items-center rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-600 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <FiRotateCcw className="mr-2 -ml-0.5 h-4 w-4" />
                {t("requestRefund")}
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
};

export default OrderRow;
