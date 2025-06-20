"use client";

import { formatCurrency } from "@/lib/utils";
import { OrderItem, Product } from "@/types";
import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from "@coreui/react";
import Image from "next/image";
import Link from "next/link";

interface OrderItemsTableProps {
  items: OrderItem[];
}

const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ items }) => {
  return (
    <div className="overflow-x-auto">
      <CTable hover className="align-middle" style={{ minWidth: "700px" }}>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell colSpan={2}>Sản phẩm</CTableHeaderCell>
            <CTableHeaderCell className="text-end">Đơn giá</CTableHeaderCell>
            <CTableHeaderCell className="text-center">
              Số lượng
            </CTableHeaderCell>
            <CTableHeaderCell className="text-end">Thành tiền</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {items.map((item) => {
            const productData =
              item.product && typeof item.product === "object"
                ? (item.product as Product)
                : null;
            const variantDisplayName = item.variant?.options
              ?.map((opt) => `${opt.attributeName}: ${opt.value}`)
              .join(" / ");

            return (
              <CTableRow key={item._id}>
                <CTableDataCell style={{ width: "80px" }}>
                  <Image
                    src={item.image || "/placeholder-image.jpg"}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="rounded border object-cover"
                  />
                </CTableDataCell>
                <CTableDataCell>
                  {productData ? (
                    // Nếu sản phẩm còn tồn tại, hiển thị link
                    <Link
                      href={`/products/${productData.slug}`}
                      target="_blank"
                      className="font-medium text-gray-800 hover:text-indigo-600 text-decoration-none"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    // Nếu sản phẩm đã bị xóa, chỉ hiển thị tên (không có link)
                    <div className="flex items-center">
                      <span className="font-medium text-gray-500 line-through">
                        {item.name}
                      </span>
                      <CTooltip content="Sản phẩm này đã bị xóa khỏi hệ thống">
                        <CIcon
                          icon={cilWarning}
                          className="ml-2 h-4 w-4 text-orange-500"
                        />
                      </CTooltip>
                    </div>
                  )}
                  {variantDisplayName && (
                    <p className="mt-1 text-xs text-gray-500">
                      {variantDisplayName}
                    </p>
                  )}
                  {item.variant?.sku && (
                    <p className="text-xs text-gray-500">
                      SKU: <code>{item.variant.sku}</code>
                    </p>
                  )}
                </CTableDataCell>
                <CTableDataCell className="text-end">
                  {formatCurrency(item.price)}
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  x {item.quantity}
                </CTableDataCell>
                <CTableDataCell className="text-end font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </CTableDataCell>
              </CTableRow>
            );
          })}
        </CTableBody>
      </CTable>
    </div>
  );
};

export default OrderItemsTable;
