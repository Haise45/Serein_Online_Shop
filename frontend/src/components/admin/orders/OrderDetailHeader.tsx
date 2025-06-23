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

interface OrderDetailHeaderProps {
  order: Order;
  onRestockClick: () => void;
  isRestocking: boolean;
}

const getStatusConfig = (status: string) => {
  const config: OrderStatusConfig = ORDER_STATUSES.find(
    (s) => s.value === status,
  ) || { value: status, label: status, color: "light" };
  if (!config)
    return {
      label: status,
      color: "secondary",
      textColor: "text-gray-800",
      ringColor: "ring-gray-300",
    };

  // Thêm các class màu của Tailwind để dễ dàng tùy chỉnh
  const colorMap: Record<string, { textColor: string; ringColor: string }> = {
    success: { textColor: "text-green-700", ringColor: "ring-green-600/20" },
    primary: { textColor: "text-blue-700", ringColor: "ring-blue-600/20" },
    info: { textColor: "text-cyan-700", ringColor: "ring-cyan-600/20" },
    warning: { textColor: "text-amber-700", ringColor: "ring-amber-600/20" },
    danger: { textColor: "text-red-700", ringColor: "ring-red-600/20" },
    dark: { textColor: "text-gray-700", ringColor: "ring-gray-600/20" },
    secondary: { textColor: "text-gray-600", ringColor: "ring-gray-500/20" },
  };

  return { ...config, ...(colorMap[config.color] || colorMap.secondary) };
};

const OrderDetailHeader: React.FC<OrderDetailHeaderProps> = ({
  order,
  onRestockClick,
  isRestocking,
}) => {
  const updateStatusMutation = useUpdateOrderStatusAdmin();
  const canRestock = ["Cancelled", "Refunded"].includes(order.status);
  const canTakeAction = !["Delivered", "Cancelled", "Refunded"].includes(
    order.status,
  );
  const hasBeenRestored = order.isStockRestored;
  const restockTooltipText = hasBeenRestored
    ? "Hành động này không thể thực hiện lại"
    : "Khôi phục lại số lượng sản phẩm vào kho";

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

  const currentStatusConfig = getStatusConfig(order.status);

  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Thông tin đơn hàng */}
      <div>
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Đơn hàng #{order._id.slice(-6).toUpperCase()}
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
          Đặt lúc: {new Date(order.createdAt).toLocaleString("vi-VN")}
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
                Khôi phục tồn kho
              </CButton>
            </span>
          </CTooltip>
        )}

        {hasBeenRestored && (
          <div className="flex items-center gap-2 rounded-md bg-green-100 px-3 py-1.5 text-sm text-green-700">
            <CIcon icon={cilCheckCircle} />
            <span>Đã khôi phục kho</span>
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
              <span className="ms-2">Cập nhật trạng thái</span>
            </CDropdownToggle>
            <CDropdownMenu>
              {targetStatuses.map((status) => {
                const config = getStatusConfig(status);
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
                    Chuyển sang &quot;{config.label}&quot;
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
