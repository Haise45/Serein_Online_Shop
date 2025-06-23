"use client";

import { ORDER_STATUSES } from "@/constants/orderConstants";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { Order, OrderItem } from "@/types";
import {
  cilCheckCircle,
  cilExternalLink,
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
import { useState } from "react";

interface UserOrdersTableProps {
  orders: Order[];
}

// Helper để lấy màu và text cho badge trạng thái
const getStatusBadge = (status: string) => {
  const config = ORDER_STATUSES.find((s) => s.value === status) || {
    color: "light",
    label: status,
  };
  return <CBadge color={config.color}>{config.label}</CBadge>;
};

const UserOrdersTable: React.FC<UserOrdersTableProps> = ({ orders }) => {
  // --- State and handlers for the items modal ---
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleViewItemsClick = (order: Order) => {
    setSelectedOrderItems(order.orderItems);
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleViewOrderDetails = () => {
    if (selectedOrder) {
      router.push(`/admin/orders/${selectedOrder._id}`);
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <CTable hover responsive className="align-middle text-sm">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Mã đơn</CTableHeaderCell>
              <CTableHeaderCell>Ngày đặt</CTableHeaderCell>
              <CTableHeaderCell>Sản phẩm</CTableHeaderCell>
              <CTableHeaderCell className="text-end">
                Tổng tiền
              </CTableHeaderCell>
              <CTableHeaderCell className="text-center">
                Trạng thái
              </CTableHeaderCell>
              <CTableHeaderCell className="text-center">
                Thanh toán
              </CTableHeaderCell>
              <CTableHeaderCell className="text-center">
                Hành động
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {orders.map((order) => {
              const firstItem = order.orderItems[0];
              return (
                <CTableRow key={order._id}>
                  <CTableDataCell>
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="fw-medium text-decoration-none text-indigo-600 hover:underline"
                    >
                      #{order._id.slice(-6).toUpperCase()}
                    </Link>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div
                      title={new Date(order.createdAt).toLocaleString("vi-VN")}
                    >
                      {timeAgo(order.createdAt)}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell style={{ minWidth: "250px" }}>
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
                          {/* Span to Button */}
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
                      {formatCurrency(order.totalPrice)}
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
                    <CTooltip content="Xem chi tiết đơn hàng">
                      <Link href={`/admin/orders/${order._id}`} passHref>
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          className="p-2"
                        >
                          <CIcon icon={cilPen} size="sm" />
                        </CButton>
                      </Link>
                    </CTooltip>
                  </CTableDataCell>
                </CTableRow>
              );
            })}
          </CTableBody>
        </CTable>
      </div>

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
            <span className="text-primary fw-medium">
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
                const variantDisplayName =
                  item.variant?.options
                    .map((opt) => `${opt.attributeName}: ${opt.value}`)
                    .join(" / ") || null;

                return (
                  <CTableRow
                    key={item.product + (item.variant?.variantId || "")}
                    className="align-middle"
                  >
                    <CTableDataCell>
                      <Image
                        src={item.image || "/placeholder-image.jpg"}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="rounded border object-cover"
                        style={{ aspectRatio: "1 / 1" }}
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
                      {formatCurrency(item.price)}
                    </CTableDataCell>
                    <CTableDataCell className="fw-semibold text-end">
                      {formatCurrency(item.price * item.quantity)}
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
    </>
  );
};

export default UserOrdersTable;
