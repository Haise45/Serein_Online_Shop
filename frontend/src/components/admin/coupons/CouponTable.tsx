"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Coupon } from "@/types";
import { cilCheckCircle, cilPen, cilTrash, cilXCircle } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CBadge,
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from "@coreui/react";
import classNames from "classnames";

interface CouponTableProps {
  coupons: Coupon[];
  onDeleteClick: (couponId: string, couponCode: string) => void;
  onEditClick: (couponId: string) => void;
}

const CouponTable: React.FC<CouponTableProps> = ({
  coupons,
  onDeleteClick,
  onEditClick,
}) => {
  const now = new Date();

  return (
    <CTable hover responsive className="align-middle text-sm">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Mã Code</CTableHeaderCell>
          <CTableHeaderCell>Mô tả</CTableHeaderCell>
          <CTableHeaderCell>Giá trị giảm</CTableHeaderCell>
          <CTableHeaderCell>Điều kiện</CTableHeaderCell>
          <CTableHeaderCell className="text-center">Sử dụng</CTableHeaderCell>
          <CTableHeaderCell>Hiệu lực</CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            Trạng thái
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">Hành động</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {coupons.map((coupon) => {
          const isExpired = new Date(coupon.expiryDate) < now;
          const status = coupon.isActive && !isExpired ? "active" : "inactive";

          return (
            <CTableRow key={coupon._id}>
              <CTableDataCell>
                <code className="fw-bold text-indigo-600">{coupon.code}</code>
              </CTableDataCell>
              <CTableDataCell>
                <div
                  className="truncate"
                  style={{ maxWidth: "200px" }}
                  title={coupon.description || ""}
                >
                  {coupon.description || (
                    <span className="text-muted">N/A</span>
                  )}
                </div>
              </CTableDataCell>
              <CTableDataCell>
                <div className="fw-semibold text-success">
                  {coupon.discountType === "percentage"
                    ? `${coupon.discountValue}%`
                    : formatCurrency(coupon.discountValue)}
                </div>
              </CTableDataCell>
              <CTableDataCell>
                <div className="text-xs">
                  {coupon.minOrderValue > 0 && (
                    <div>
                      ĐH tối thiểu: {formatCurrency(coupon.minOrderValue)}
                    </div>
                  )}
                  <div>
                    Áp dụng cho:{" "}
                    <CBadge
                      color="info"
                      shape="rounded-pill"
                      className="!text-white"
                    >
                      {coupon.applicableTo === "all"
                        ? "Tất cả"
                        : coupon.applicableTo === "products"
                          ? "Sản phẩm"
                          : "Danh mục"}
                    </CBadge>
                  </div>
                </div>
              </CTableDataCell>
              <CTableDataCell className="text-center">
                {coupon.usageCount} / {coupon.maxUsage || "∞"}
              </CTableDataCell>
              <CTableDataCell>
                <div className="text-xs">
                  <div>Bắt đầu: {formatDate(coupon.startDate)}</div>
                  <div>Kết thúc: {formatDate(coupon.expiryDate)}</div>
                </div>
              </CTableDataCell>
              <CTableDataCell className="text-center">
                <CTooltip
                  content={
                    status === "active"
                      ? "Đang hoạt động"
                      : "Vô hiệu hóa / Hết hạn"
                  }
                >
                  <CIcon
                    icon={status === "active" ? cilCheckCircle : cilXCircle}
                    className={classNames(
                      "text-2xl",
                      status === "active" ? "text-success" : "text-danger",
                    )}
                  />
                </CTooltip>
              </CTableDataCell>
              <CTableDataCell className="text-center">
                <div className="d-flex justify-content-center gap-2">
                  <CTooltip content="Sửa mã giảm giá">
                    <CButton
                      color="info"
                      variant="outline"
                      size="sm"
                      className="p-2"
                      onClick={() => onEditClick(coupon._id)}
                    >
                      <CIcon icon={cilPen} size="sm" />
                    </CButton>
                  </CTooltip>
                  {coupon.isActive && (
                    <CTooltip content="Vô hiệu hóa">
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        className="p-2"
                        onClick={() => onDeleteClick(coupon._id, coupon.code)}
                      >
                        <CIcon icon={cilTrash} size="sm" />
                      </CButton>
                    </CTooltip>
                  )}
                </div>
              </CTableDataCell>
            </CTableRow>
          );
        })}
      </CTableBody>
    </CTable>
  );
};

export default CouponTable;
