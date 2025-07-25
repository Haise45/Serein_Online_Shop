"use client";

import { ORDER_STATUSES, OrderStatusConfig } from "@/constants/orderConstants";
import { useUpdateOrderStatusAdmin } from "@/lib/react-query/orderQueries";
import { UpdateOrderStatusAdminPayload } from "@/services/orderService";
import { Order } from "@/types";
import {
  cilCheckCircle,
  cilClock,
  cilLoopCircular,
  cilOptions,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CBadge,
  CButton,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CSpinner,
  CTooltip,
} from "@coreui/react";
import classNames from "classnames";
import { useTranslations, useLocale } from "next-intl";

interface OrderDetailHeaderProps {
  order: Order;
  onRestockClick: () => void;
  isRestocking: boolean;
}

const getStatusConfig = (
  status: string,
  t: ReturnType<typeof useTranslations>, // Định nghĩa kiểu cho hàm t
): Omit<OrderStatusConfig, "label"> & {
  label: string;
  textColor: string;
  ringColor: string;
} => {
  // Tìm config gốc từ hằng số để lấy `color`
  const baseConfig = ORDER_STATUSES.find((s) => s.value === status) || {
    value: status,
    label: status, // Label này sẽ bị ghi đè
    color: "light",
  };
  
  // Dùng hàm `t` để dịch label
  const translatedLabel = t(status as string);

  // Thêm các class màu (logic này không đổi)
  const colorMap: Record<string, { textColor: string; ringColor: string }> = {
    success: { textColor: "text-green-700", ringColor: "ring-green-600/20" },
    primary: { textColor: "text-blue-700", ringColor: "ring-blue-600/20" },
    info: { textColor: "text-cyan-700", ringColor: "ring-cyan-600/20" },
    warning: { textColor: "text-amber-700", ringColor: "ring-amber-600/20" },
    danger: { textColor: "text-red-700", ringColor: "ring-red-600/20" },
    dark: { textColor: "text-gray-700", ringColor: "ring-gray-600/20" },
    secondary: { textColor: "text-gray-600", ringColor: "ring-gray-500/20" },
  };

  return {
    ...baseConfig,
    label: translatedLabel, // Ghi đè label bằng giá trị đã dịch
    ...(colorMap[baseConfig.color] || colorMap.secondary),
  };
};

const OrderDetailHeader: React.FC<OrderDetailHeaderProps> = ({
  order,
  onRestockClick,
  isRestocking,
}) => {
  const locale = useLocale();
  const t = useTranslations("AdminOrderDetail.header");
  const tStatus = useTranslations("OrderStatus");
  const updateStatusMutation = useUpdateOrderStatusAdmin();
  const canRestock = ["Cancelled", "Refunded"].includes(order.status);
  const canTakeAction = !["Delivered", "Cancelled", "Refunded"].includes(
    order.status,
  );
  const hasBeenRestored = order.isStockRestored;
  const restockTooltipText = hasBeenRestored
    ? t("restockTooltipDone")
    : t("restockTooltip");

  // Các trạng thái mà Admin có thể chủ động chuyển đến
  const targetStatuses: UpdateOrderStatusAdminPayload["status"][] = [
    "Processing",
    "Shipped",
    "Cancelled",
  ];

  const handleStatusChange = (
    newStatus: UpdateOrderStatusAdminPayload["status"],
  ) => {
    updateStatusMutation.mutate({
      orderId: order._id,
      payload: { status: newStatus },
    });
  };

  const currentStatusConfig = getStatusConfig(order.status, tStatus);

  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Thông tin đơn hàng */}
      <div>
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {t("order", { id: order._id.slice(-6).toUpperCase() })}
          </h2>
          <CBadge
            color={currentStatusConfig.color}
            className={classNames(
              "ms-3 px-2.5 py-1.5",
              currentStatusConfig.textColor,
            )}
          >
            {currentStatusConfig.label}
          </CBadge>
        </div>
        <p className="mt-1 flex items-center text-sm text-gray-500">
          <CIcon icon={cilClock} className="mr-1.5 h-4 w-4" />
          {t("placedAt", {
            date: new Date(order.createdAt).toLocaleString(locale),
          })}
        </p>
      </div>
      {/* Các nút hành động */}
      <div className="flex items-center gap-2">
        {/* Nút Restock */}
        {canRestock && (
          <CTooltip content={restockTooltipText}>
            <span>
              <CButton
                color="warning"
                onClick={onRestockClick}
                disabled={isRestocking || hasBeenRestored} // Vô hiệu hóa khi đang xử lý HOẶC đã được khôi phục
              >
                <CIcon icon={cilLoopCircular} className="me-2" />
                {t("restock")}
              </CButton>
            </span>
          </CTooltip>
        )}

        {hasBeenRestored && (
          <div className="flex items-center gap-2 rounded-md bg-green-100 px-3 py-1.5 text-sm text-green-700">
            <CIcon icon={cilCheckCircle} />
            <span>{t("restored")}</span>
          </div>
        )}
        {/* Dropdown cập nhật trạng thái */}
        {canTakeAction && (
          <CDropdown>
            <CDropdownToggle
              color="primary"
              variant="outline"
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <CSpinner size="sm" />
              ) : (
                <CIcon icon={cilOptions} />
              )}
              <span className="ms-2">{t("updateStatus")}</span>
            </CDropdownToggle>
            <CDropdownMenu>
              {targetStatuses.map((status) => {
                const config = getStatusConfig(status, tStatus);
                return (
                  <CDropdownItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={classNames(
                      "flex items-center",
                      config.textColor,
                    )}
                  >
                    {/* <CIcon icon={config.icon} className="me-2" /> */}
                    {t("moveTo", { status: config.label })}
                  </CDropdownItem>
                );
              })}
            </CDropdownMenu>
          </CDropdown>
        )}
      </div>
    </div>
  );
};

export default OrderDetailHeader;
