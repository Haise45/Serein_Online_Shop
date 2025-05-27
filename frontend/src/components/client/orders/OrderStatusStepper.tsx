"use client";

import { Order } from "@/types/order_model";
import classNames from "classnames";
import {
  FiCheck,
  FiCheckCircle,
  FiCircle,
  FiPackage,
  FiRefreshCw,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

interface OrderStatusStepperProps {
  currentStatus: Order["status"]; // Kiểu status từ model Order
}

// Cấu hình các bước tương ứng với từng trạng thái
const STEPS_CONFIG = [
  {
    id: "Pending",
    label: "Chờ xác nhận",
    icon: FiCircle,
    relevantStatuses: ["Pending", "CancellationRequested"],
  },
  {
    id: "Processing",
    label: "Đang xử lý",
    icon: FiPackage,
    relevantStatuses: ["Processing", "CancellationRequested"],
  },
  {
    id: "Shipped",
    label: "Đang giao",
    icon: FiTruck,
    relevantStatuses: ["Shipped", "RefundRequested"],
  },
  {
    id: "Delivered",
    label: "Đã giao",
    icon: FiCheckCircle,
    relevantStatuses: ["Delivered", "RefundRequested"],
  },
];

// Các trạng thái hủy/hoàn tiền
const CANCELLED_STATUSES = ["Cancelled", "Refunded"];
const REQUEST_STATUSES = ["CancellationRequested", "RefundRequested"];

export default function OrderStatusStepper({
  currentStatus,
}: OrderStatusStepperProps) {
  const currentStepIndex = STEPS_CONFIG.findIndex((step) =>
    step.relevantStatuses.includes(currentStatus),
  );

  const isCancelledOrRefunded = CANCELLED_STATUSES.includes(currentStatus);
  const isRequestStatus = REQUEST_STATUSES.includes(currentStatus);

  // Gán nhãn tiếng Việt cho trạng thái
  let statusLabel = currentStatus;
  if (currentStatus === "Pending") statusLabel = "Chờ xác nhận";
  else if (currentStatus === "Processing") statusLabel = "Đang xử lý";
  else if (currentStatus === "Shipped") statusLabel = "Đang vận chuyển";
  else if (currentStatus === "Delivered") statusLabel = "Đã giao thành công";
  else if (currentStatus === "Cancelled") statusLabel = "Đã hủy";
  else if (currentStatus === "Refunded") statusLabel = "Đã hoàn tiền";
  else if (currentStatus === "CancellationRequested")
    statusLabel = "Yêu cầu hủy đang chờ";
  else if (currentStatus === "RefundRequested")
    statusLabel = "Yêu cầu hoàn tiền đang chờ";

  // Trường hợp đơn bị hủy hoặc đã hoàn tiền
  if (isCancelledOrRefunded) {
    return (
      <div className="my-4 rounded-md border border-red-200 bg-red-50 p-4 text-center sm:my-6 md:my-8">
        <FiXCircle className="mx-auto mb-2 h-10 w-10 text-red-500" />
        <p className="text-lg font-semibold text-red-700">
          Đơn hàng {currentStatus === "Cancelled" ? "Đã Hủy" : "Đã Hoàn Tiền"}
        </p>
      </div>
    );
  }

  // Trường hợp đang yêu cầu hủy hoặc hoàn tiền
  if (isRequestStatus) {
    return (
      <div className="my-4 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-center sm:my-6 md:my-8">
        <FiRefreshCw className="mx-auto mb-2 h-10 w-10 animate-spin text-yellow-500" />
        <p className="text-lg font-semibold text-yellow-700">
          {currentStatus === "CancellationRequested"
            ? "Đang Yêu Cầu Hủy Đơn"
            : "Đang Yêu Cầu Hoàn Tiền"}
        </p>
        <p className="mt-1 text-sm text-yellow-600">
          Yêu cầu của bạn đang được xử lý.
        </p>
      </div>
    );
  }

  return (
    <div className="my-4 sm:my-6 md:my-8">
      <h3 className="sr-only">Theo dõi đơn hàng</h3>
      <div className="relative">
        {/* Đường kẻ ngang nối các bước */}
        <div
          className="absolute top-1/3 left-0 -mt-px h-0.5 w-full bg-gray-200"
          aria-hidden="true"
        />

        <ul
          role="list"
          // Responsive grid: 2 bước/1 hàng ở mobile, 4 bước/1 hàng ở tablet trở lên
          className="relative grid grid-cols-4 gap-x-3 sm:gap-x-4"
        >
          {STEPS_CONFIG.map((step, stepIdx) => (
            <li
              key={step.id}
              className="relative flex flex-col items-center text-center"
            >
              {/* Vòng tròn icon trạng thái */}
              <div
                className={classNames(
                  "flex items-center justify-center rounded-full border-2 bg-white",
                  "h-10 w-10 md:h-12 md:w-12",
                  stepIdx <= currentStepIndex
                    ? "border-indigo-600"
                    : "border-gray-300",
                )}
              >
                {/* Nếu đã hoàn tất bước này */}
                {stepIdx < currentStepIndex ? (
                  <FiCheck
                    className="h-5 w-5 text-indigo-600 md:h-6 md:w-6"
                    aria-hidden="true"
                  />
                ) : stepIdx === currentStepIndex ? (
                  // Bước hiện tại có hiệu ứng ping
                  <span className="relative flex h-3 w-3 md:h-3.5 md:w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex h-full w-full rounded-full bg-indigo-600"></span>
                  </span>
                ) : (
                  // Bước chưa tới
                  <step.icon
                    className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5 md:h-6 md:w-6"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Nhãn bước */}
              <p
                className={classNames(
                  "mt-1 text-[10px] font-medium sm:mt-2 sm:text-xs md:text-sm",
                  stepIdx <= currentStepIndex
                    ? "text-indigo-600"
                    : "text-gray-500",
                )}
              >
                {step.label}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Trạng thái hiện tại */}
      <p className="mt-4 text-center text-xs text-gray-600 sm:text-sm">
        Trạng thái hiện tại:{" "}
        <span className="font-semibold text-indigo-700">{statusLabel}</span>
      </p>
    </div>
  );
}
