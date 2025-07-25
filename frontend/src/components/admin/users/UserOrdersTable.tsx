"use client";

import { useSettings } from "@/app/SettingsContext";
import RelativeTime from "@/components/shared/RelativeTime";
import { formatCurrency, getLocalizedName } from "@/lib/utils";
import { Order, OrderItem } from "@/types";
import {
  cilCheckCircle,
  cilExternalLink,
  cilPen,
  cilXCircle,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
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
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getStatusBadge } from "../orders/OrderTable";

interface UserOrdersTableProps {
  orders: Order[];
}

const UserOrdersTable: React.FC<UserOrdersTableProps> = ({ orders }) => {
  const t = useTranslations("AdminUsers.userOrdersTable");
  const tOrder = useTranslations("AdminOrders.table");
  const tStatus = useTranslations("OrderStatus");
  const locale = useLocale() as "vi" | "en";
  // --- State and handlers for the items modal ---
  const router = useRouter();
  // *** SỬ DỤNG CONTEXT ĐỂ LẤY THÔNG TIN TIỀN TỆ ***
  const { displayCurrency, rates } = useSettings();
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

  const getStatusBadgeWithT = (status: string) =>
    getStatusBadge(status, tStatus);

  return (
    <>
      <div className="overflow-x-auto">
        <CTable hover responsive className="align-middle text-sm">
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>{t("colOrderId")}</CTableHeaderCell>
              <CTableHeaderCell>{t("colDate")}</CTableHeaderCell>
              <CTableHeaderCell>{t("colProducts")}</CTableHeaderCell>
              <CTableHeaderCell className="text-end">
                {t("colTotal")}
              </CTableHeaderCell>
              <CTableHeaderCell className="text-center">
                {t("colStatus")}
              </CTableHeaderCell>
              <CTableHeaderCell className="text-center">
                {t("colPayment")}
              </CTableHeaderCell>
              <CTableHeaderCell className="text-center">
                {t("colActions")}
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {orders.map((order) => {
              const firstItem = order.orderItems[0];
              const localizedItemName = firstItem
                ? getLocalizedName(firstItem.name, locale)
                : "";

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
                  <CTableDataCell
                    style={{ minWidth: "95px" }}
                  >
                    <div
                      title={new Date(order.createdAt).toLocaleString(locale)}
                    >
                      <RelativeTime date={order.createdAt} />
                    </div>
                  </CTableDataCell>
                  <CTableDataCell style={{ minWidth: "250px" }}>
                    {firstItem && (
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Image
                            src={firstItem.image || "/placeholder-image.jpg"}
                            alt={localizedItemName}
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
                            title={localizedItemName}
                          >
                            {localizedItemName}
                          </div>
                          {/* Span to Button */}
                          {order.orderItems.length > 1 && (
                            <button
                              onClick={() => handleViewItemsClick(order)}
                              className="mt-1 text-xs text-indigo-600 hover:underline"
                            >
                              {t("moreProducts", {
                                count: order.orderItems.length - 1,
                              })}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <span className="fw-semibold text-gray-800">
                      {formatCurrency(order.totalPrice, {
                        currency: displayCurrency,
                        rates,
                      })}
                    </span>
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    {getStatusBadgeWithT(order.status)}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CTooltip
                      content={
                        order.isPaid
                          ? t("paidTooltip", {
                              date: new Date(order.paidAt!).toLocaleString(
                                locale,
                              ),
                            })
                          : t("unpaidTooltip")
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
                    <CTooltip content={t("viewDetailsTooltip")}>
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
            <span>
              {tOrder.rich("itemsModalTitle", {
                id: selectedOrder?._id?.slice(-6).toUpperCase() || "",
                primary: (chunks) => (
                  <span className="font-semibold text-indigo-600">
                    {chunks}
                  </span>
                ),
              })}
            </span>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style={{ width: "80px" }}>
                  {tOrder("itemsModalColImage")}
                </CTableHeaderCell>
                <CTableHeaderCell>
                  {tOrder("itemsModalColName")}
                </CTableHeaderCell>
                <CTableHeaderCell style={{ width: "150px" }}>
                  {tOrder("itemsModalColSku")}
                </CTableHeaderCell>
                <CTableHeaderCell
                  className="text-center"
                  style={{ width: "100px" }}
                >
                  {tOrder("itemsModalColQty")}
                </CTableHeaderCell>
                <CTableHeaderCell
                  className="text-end"
                  style={{ width: "130px" }}
                >
                  {tOrder("itemsModalColPrice")}
                </CTableHeaderCell>
                <CTableHeaderCell
                  className="text-end"
                  style={{ width: "130px" }}
                >
                  {tOrder("itemsModalColTotal")}
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
                      {formatCurrency(item.price, {
                        currency: displayCurrency,
                        rates,
                      })}
                    </CTableDataCell>
                    <CTableDataCell className="fw-semibold text-end">
                      {formatCurrency(item.price * item.quantity, {
                        currency: displayCurrency,
                        rates,
                      })}
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
            {tOrder("itemsModalClose")}
          </CButton>
          <CButton color="primary" onClick={handleViewOrderDetails}>
            <CIcon icon={cilExternalLink} className="me-2" />
            {tOrder("itemsModalViewDetails")}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default UserOrdersTable;
