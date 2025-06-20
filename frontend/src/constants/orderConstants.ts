export type OrderStatusConfig = {
  value: string;
  label: string;
  color: string;
};

export const ORDER_STATUSES: OrderStatusConfig[] = [
  { value: "Pending", label: "Chờ xác nhận", color: "secondary" },
  { value: "Processing", label: "Đang xử lý", color: "info" },
  { value: "Shipped", label: "Đang giao", color: "primary" },
  { value: "Delivered", label: "Đã giao", color: "success" },
  { value: "Cancelled", label: "Đã hủy", color: "dark" },
  { value: "Refunded", label: "Đã hoàn tiền", color: "warning" },
  { value: "CancellationRequested", label: "Yêu cầu hủy", color: "danger" },
  { value: "RefundRequested", label: "Yêu cầu hoàn tiền", color: "danger" },
];
