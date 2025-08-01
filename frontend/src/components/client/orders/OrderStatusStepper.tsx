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
import { useTranslations } from "next-intl";

interface OrderStatusStepperProps {
  currentStatus: Order["status"];
}

export default function OrderStatusStepper({
  currentStatus,
}: OrderStatusStepperProps) {
  const tStatus = useTranslations("OrderStatus");
  const tStepper = useTranslations("OrderStatusStepper");

  const STEPS_CONFIG = [
    {
      id: "Pending",
      label: tStatus("Pending"),
      icon: FiCircle,
      relevantStatuses: ["Pending", "CancellationRequested"],
    },
    {
      id: "Processing",
      label: tStatus("Processing"),
      icon: FiPackage,
      relevantStatuses: ["Processing", "CancellationRequested"],
    },
    {
      id: "Shipped",
      label: tStatus("Shipped"),
      icon: FiTruck,
      relevantStatuses: ["Shipped", "RefundRequested"],
    },
    {
      id: "Delivered",
      label: tStatus("Delivered"),
      icon: FiCheckCircle,
      relevantStatuses: ["Delivered"],
    },
  ];

  const CANCELLED_STATUSES = ["Cancelled", "Refunded"];
  const REQUEST_STATUSES = ["CancellationRequested", "RefundRequested"];

  // Tìm index của bước hiện tại dựa trên relevantStatuses,
  // nhưng ưu tiên Delivered nếu đó là trạng thái hiện tại.
  let currentStepIndex = STEPS_CONFIG.findIndex((step) =>
    step.relevantStatuses.includes(currentStatus),
  );

  // Nếu trạng thái là Delivered, đảm bảo currentStepIndex trỏ đến bước cuối cùng (Delivered)
  if (currentStatus === "Delivered") {
    currentStepIndex = STEPS_CONFIG.findIndex(
      (step) => step.id === "Delivered",
    );
  }

  const isCancelledOrRefunded = CANCELLED_STATUSES.includes(currentStatus);
  const isRequestStatus = REQUEST_STATUSES.includes(currentStatus);

  const statusLabel = tStatus(currentStatus);

  if (isCancelledOrRefunded) {
    return (
      <div className="my-4 rounded-md border border-red-200 bg-red-50 p-4 text-center sm:my-6 md:my-8">
        <FiXCircle className="mx-auto mb-2 h-10 w-10 text-red-500" />
        <p className="text-lg font-semibold text-red-700">
          {currentStatus === "Cancelled"
            ? tStepper("cancelledMessage")
            : tStepper("refundedMessage")}
        </p>
      </div>
    );
  }

  if (isRequestStatus && currentStatus !== "RefundRequested") {
    // Loại trừ RefundRequested khỏi đây nếu nó có thể đi chung với Delivered
    return (
      <div className="my-4 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-center sm:my-6 md:my-8">
        <FiRefreshCw className="mx-auto mb-2 h-10 w-10 animate-spin text-yellow-500" />
        <p className="text-lg font-semibold text-yellow-700">
          {currentStatus === "CancellationRequested"
            ? tStepper("cancellationPendingMessage")
            : tStepper("refundPendingMessage")}
        </p>
        <p className="mt-1 text-sm text-yellow-600">
          {tStepper("pendingMessage")}
        </p>
      </div>
    );
  }

  // Nếu là RefundRequested và đơn đã Delivered, vẫn hiển thị stepper nhưng có thể thêm thông báo
  const showRefundRequestMessageWithStepper =
    currentStatus === "RefundRequested" &&
    currentStepIndex ===
      STEPS_CONFIG.findIndex((step) => step.id === "Delivered");

  return (
    <div className="my-4 sm:my-6 md:my-8">
      <h3 className="sr-only">{tStepper("trackOrder")}</h3>
      {showRefundRequestMessageWithStepper && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-center">
          <FiRefreshCw className="mx-auto mb-1 h-6 w-6 text-yellow-500" />
          <p className="text-sm font-semibold text-yellow-700">
            {tStepper("refundPendingMessage")}
          </p>
        </div>
      )}
      <div className="relative">
        <div
          className="absolute top-1/3 left-0 -mt-px h-0.5 w-full bg-gray-200"
          aria-hidden="true"
        />
        <ul
          role="list"
          className="relative grid grid-cols-4 gap-x-3 sm:gap-x-4"
        >
          {STEPS_CONFIG.map((step, stepIdx) => {
            // Xác định xem bước này đã hoàn thành, đang hoạt động, hay chưa tới
            const isCompleted = stepIdx < currentStepIndex;
            const isActive = stepIdx === currentStepIndex;
            // Đặc biệt: Nếu trạng thái hiện tại là "Delivered", tất cả các bước trước đó và cả bước "Delivered" đều là completed.
            const isFullyCompletedStep =
              currentStatus === "Delivered" && stepIdx <= currentStepIndex;

            return (
              <li
                key={step.id}
                className="relative flex flex-col items-center text-center"
              >
                <div
                  className={classNames(
                    "flex items-center justify-center rounded-full border-2 bg-white",
                    "h-10 w-10 md:h-12 md:w-12",
                    // Màu border dựa trên việc đã hoàn thành hay chưa
                    isCompleted || isActive || isFullyCompletedStep
                      ? "border-indigo-600"
                      : "border-gray-300",
                  )}
                >
                  {/* Icon hiển thị */}
                  {isCompleted || isFullyCompletedStep ? ( // Nếu bước đã hoàn thành HOẶC toàn bộ quy trình đã "Delivered" và đây là bước đó hoặc trước đó
                    <FiCheck
                      className="h-5 w-5 text-indigo-600 md:h-6 md:w-6"
                      aria-hidden="true"
                    />
                  ) : isActive && !isFullyCompletedStep ? ( // Nếu là bước hiện tại và chưa phải là "Delivered" cuối cùng
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
                <p
                  className={classNames(
                    "mt-1 text-[10px] font-medium sm:mt-2 sm:text-xs md:text-sm",
                    isCompleted || isActive || isFullyCompletedStep
                      ? "text-indigo-600"
                      : "text-gray-500",
                  )}
                >
                  {step.label}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-4 text-center text-xs text-gray-600 sm:text-sm">
        {tStepper.rich("currentStatus", {
          status: statusLabel,
          bold: (chunks) => (
            <span className="font-semibold text-indigo-700">{chunks}</span>
          ),
        })}
      </p>
    </div>
  );
}
