"use client";

import { useSettings } from "@/app/SettingsContext";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { useRestockOrderItemsAdmin } from "@/lib/react-query/orderQueries";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { OrderItem, OrderSummary } from "@/types/order_model";
import {
  cilCheckCircle,
  cilExternalLink,
  cilLoopCircular,
  cilPen,
  cilXCircle,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CBadge,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from "@coreui/react";
import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

// Helper để định dạng trạng thái đơn hàng
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { color: string; text: string }> = {
    Pending: { color: "secondary", text: "Chờ xác nhận" },
    Processing: { color: "info", text: "Đang xử lý" },
    Shipped: { color: "primary", text: "Đang giao" },
    Delivered: { color: "success", text: "Đã giao" },
    Cancelled: { color: "dark", text: "Đã hủy" },
    Refunded: { color: "warning", text: "Đã hoàn tiền" },
    CancellationRequested: { color: "danger", text: "Yêu cầu hủy" },
    RefundRequested: { color: "danger", text: "Yêu cầu hoàn tiền" },
  };
  const config = statusMap[status] || { color: "light", text: status };
  return <CBadge color={config.color}>{config.text}</CBadge>;
};

interface OrderTableProps {
  orders: OrderSummary[];
  handleSort: (columnName: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  queryString: string;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  handleSort,
  sortBy,
  sortOrder,
  queryString,
}) => {
  // --- State ---
  const router = useRouter(); // Khởi tạo router
  // *** SỬ DỤNG CONTEXT ĐỂ LẤY THÔNG TIN TIỀN TỆ ***
  const { displayCurrency, rates } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [restockModal, setRestockModal] = useState<{
    visible: boolean;
    orderId: string | null;
  }>({ visible: false, orderId: null });

  const restockMutation = useRestockOrderItemsAdmin();

  const handleViewItemsClick = (order: OrderSummary) => {
    setSelectedOrderItems(order.orderItems as OrderItem[]);
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleViewOrderDetails = () => {
    if (selectedOrder) {
      router.push(`/admin/orders/${selectedOrder._id}`);
    }
    setIsModalOpen(false);
  };

  const handleOpenRestockModal = (orderId: string) => {
    setRestockModal({ visible: true, orderId });
  };

  const handleConfirmRestock = () => {
    if (restockModal.orderId) {
      restockMutation.mutate(restockModal.orderId, {
        onSuccess: () => {
          setRestockModal({ visible: false, orderId: null });
        },
      });
    }
  };

  const renderSortIcon = (columnName: string) => {
    if (sortBy !== columnName) return null;
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  return (
    <>
      <CTable
        hover
        responsive={false}
        className="mb-0 table-fixed"
        style={{ minWidth: "1200px", fontSize: "0.875rem" }}
      >
        <CTableHead className="bg-light border-bottom">
          <CTableRow>
            <CTableHeaderCell
              style={{ width: "100px" }}
              className="fw-semibold text-center"
            >
              Mã Đơn
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "200px" }}
              className="fw-semibold"
            >
              Khách hàng
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "150px" }}
              onClick={() => handleSort("createdAt")}
              className="fw-semibold user-select-none cursor-pointer hover:bg-gray-100"
            >
              Ngày đặt {renderSortIcon("createdAt")}
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "250px" }}
              className="fw-semibold"
            >
              Sản phẩm
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "130px" }}
              onClick={() => handleSort("totalPrice")}
              className="fw-semibold user-select-none cursor-pointer text-end hover:bg-gray-100"
            >
              Tổng tiền {renderSortIcon("totalPrice")}
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "150px" }}
              onClick={() => handleSort("status")}
              className="fw-semibold user-select-none cursor-pointer text-center hover:bg-gray-100"
            >
              Trạng thái {renderSortIcon("status")}
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "100px" }}
              className="fw-semibold text-center"
            >
              Thanh toán
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "100px" }}
              className="fw-semibold text-center"
            >
              Hành động
            </CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {orders.map((order) => {
            const isGuest = !order.user;
            const customerName = isGuest
              ? order.shippingAddress.fullName
              : order.user!.name;
            const customerContact = isGuest
              ? order.guestOrderEmail
              : order.user!.email;
            const firstItem = order.orderItems[0];
            const canRestock = ["Cancelled", "Refunded"].includes(order.status);
            const hasBeenRestored = order.isStockRestored;
            const restockTooltip = hasBeenRestored
              ? "Tồn kho đã được khôi phục"
              : "Khôi phục tồn kho";

            const detailLink = `/admin/orders/${order._id}?${queryString}`;

            return (
              <CTableRow key={order._id} className="align-middle">
                <CTableDataCell className="text-center">
                  <Link
                    href={detailLink}
                    className="text-primary fw-medium text-decoration-none"
                  >
                    #{order._id.slice(-6).toUpperCase()}
                  </Link>
                </CTableDataCell>
                <CTableDataCell style={{ minWidth: "180px" }}>
                  <div
                    className="fw-medium truncate text-gray-800"
                    title={customerName}
                  >
                    {customerName}
                  </div>
                  <div
                    className="text-muted truncate text-xs"
                    title={customerContact || "N/A"}
                  >
                    {customerContact || "Guest"}
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  <div
                    title={new Date(order.createdAt).toLocaleString("vi-VN")}
                  >
                    {timeAgo(order.createdAt)}
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  {firstItem && (
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Image
                          src={firstItem.image || "/placeholder-image.jpg"}
                          alt={firstItem.name}
                          width={40}
                          height={40}
                          quality={100}
                          className="rounded border object-cover object-top"
                          style={{ aspectRatio: "1/1" }}
                        />
                      </div>
                      <div className="ml-3 min-w-0">
                        <div
                          className="truncate font-medium text-gray-800"
                          title={firstItem.name}
                        >
                          {firstItem.name}
                        </div>
                        {order.orderItems.length > 1 && (
                          <button
                            onClick={() => handleViewItemsClick(order)}
                            className="mt-1 text-xs text-indigo-600 hover:underline"
                          >
                            + {order.orderItems.length - 1} sản phẩm khác...
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </CTableDataCell>
                <CTableDataCell className="text-end">
                  <span className="fw-semibold text-gray-800">
                    {formatCurrency(order.totalPrice, { currency: displayCurrency, rates })}
                  </span>
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  {getStatusBadge(order.status)}
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  <CTooltip
                    content={
                      order.isPaid
                        ? `Đã thanh toán lúc ${new Date(order.paidAt!).toLocaleString("vi-VN")}`
                        : "Chưa thanh toán"
                    }
                  >
                    <CIcon
                      icon={order.isPaid ? cilCheckCircle : cilXCircle}
                      className={classNames(
                        order.isPaid ? "text-success" : "text-danger",
                      )}
                      size="lg"
                    />
                  </CTooltip>
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Link href={detailLink} passHref>
                      <CTooltip content="Xem chi tiết và xử lý đơn hàng">
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          className="p-2"
                        >
                          <CIcon icon={cilPen} size="sm" />
                        </CButton>
                      </CTooltip>
                    </Link>
                    {canRestock && (
                      <CTooltip content={restockTooltip}>
                        <span>
                          <CButton
                            color="warning"
                            variant="outline"
                            size="sm"
                            className="p-2"
                            onClick={() => handleOpenRestockModal(order._id)}
                            disabled={hasBeenRestored}
                          >
                            <CIcon icon={cilLoopCircular} size="sm" />
                          </CButton>
                        </span>
                      </CTooltip>
                    )}
                  </div>
                </CTableDataCell>
              </CTableRow>
            );
          })}
        </CTableBody>
      </CTable>
      {/* --- MODAL HIỂN THỊ CHI TIẾT SẢN PHẨM --- */}
      <CModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="xl"
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            Chi tiết sản phẩm trong đơn
            <span className="text-primary fw-medium text-decoration-none">
              {" "}
              #{selectedOrder?._id.slice(-6).toUpperCase()}
            </span>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: "80px" }}>
                  Ảnh
                </CTableHeaderCell>
                <CTableHeaderCell>Tên sản phẩm</CTableHeaderCell>
                <CTableHeaderCell style={{ width: "150px" }}>
                  SKU
                </CTableHeaderCell>
                <CTableHeaderCell
                  className="text-center"
                  style={{ width: "100px" }}
                >
                  Số lượng
                </CTableHeaderCell>
                <CTableHeaderCell
                  className="text-end"
                  style={{ width: "130px" }}
                >
                  Đơn giá
                </CTableHeaderCell>
                <CTableHeaderCell
                  className="text-end"
                  style={{ width: "130px" }}
                >
                  Tổng tiền
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {selectedOrderItems.map((item) => {
                // Giả sử item.variant.options có cấu trúc { attributeName: string, value: string }
                const variantDisplayName =
                  item.variant?.options
                    .map((opt) => `${opt.attributeName}: ${opt.value}`)
                    .join(" / ") || null;

                return (
                  <CTableRow
                    key={item._id || item.name}
                    className="align-middle"
                  >
                    <CTableDataCell>
                      <Image
                        src={item.image || "/placeholder-image.jpg"}
                        alt={item.name}
                        width={60}
                        height={60}
                        quality={100}
                        className="rounded border object-cover object-top"
                        style={{ aspectRatio: "1/1" }}
                      />
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="font-medium text-gray-800">
                        {item.name}
                      </div>
                      {variantDisplayName && (
                        <div className="mt-1 text-xs text-gray-500">
                          {variantDisplayName}
                        </div>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <code>{item.variant?.sku || "N/A"}</code>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      {item.quantity}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      {formatCurrency(item.price, { currency: displayCurrency, rates })}
                    </CTableDataCell>
                    <CTableDataCell className="fw-semibold text-end">
                      {formatCurrency(item.price * item.quantity, { currency: displayCurrency, rates })}
                    </CTableDataCell>
                  </CTableRow>
                );
              })}
            </CTableBody>
          </CTable>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setIsModalOpen(false)}
          >
            Đóng
          </CButton>
          <CButton color="primary" onClick={handleViewOrderDetails}>
            <CIcon icon={cilExternalLink} className="me-2" />
            Xem chi tiết đơn hàng
          </CButton>
        </CModalFooter>
      </CModal>

      {/* *** MODAL XÁC NHẬN RESTOCK *** */}
      <ConfirmationModal
        visible={restockModal.visible}
        onClose={() => setRestockModal({ visible: false, orderId: null })}
        onConfirm={handleConfirmRestock}
        isConfirming={restockMutation.isPending}
        title="Xác nhận Khôi phục Tồn kho"
        body={`Bạn có chắc chắn muốn cộng lại số lượng sản phẩm của đơn hàng #${restockModal.orderId?.slice(-6).toUpperCase()} vào tồn kho? Hành động này có thể ảnh hưởng đến báo cáo kho hàng.`}
        confirmButtonText="Đồng ý khôi phục"
        confirmButtonColor="warning"
      />
    </>
  );
};

export default OrderTable;
