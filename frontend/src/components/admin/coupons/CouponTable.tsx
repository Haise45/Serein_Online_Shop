"use client";

import { formatCurrency, formatDate, getLocalizedName } from "@/lib/utils";
import { CouponAdmin, ExchangeRates } from "@/types";
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
import { useLocale } from "next-intl";
import React from "react";
import { useTranslations } from "next-intl";

interface CouponTableProps {
  coupons: CouponAdmin[];
  onDeleteClick: (couponId: string, couponCode: string) => void;
  onEditClick: (couponId: string) => void;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

const CouponTable: React.FC<CouponTableProps> = ({
  coupons,
  onDeleteClick,
  onEditClick,
  displayCurrency,
  rates,
}) => {
  const t = useTranslations("AdminCoupons.table");
  const locale = useLocale() as "vi" | "en";
  const now = new Date();
  const currencyOptions = { currency: displayCurrency, rates };

  return (
    <CTable hover responsive className="align-middle text-sm">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>{t("colCode")}</CTableHeaderCell>
          <CTableHeaderCell>{t("colDescription")}</CTableHeaderCell>
          <CTableHeaderCell>{t("colValue")}</CTableHeaderCell>
          <CTableHeaderCell>{t("colCondition")}</CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colUsage")}
          </CTableHeaderCell>
          <CTableHeaderCell>{t("colValidity")}</CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colStatus")}
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colActions")}
          </CTableHeaderCell>
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
                  title={getLocalizedName(coupon.description, locale)}
                >
                  {getLocalizedName(coupon.description, locale) ||
                    t("noDescription")}
                </div>
              </CTableDataCell>
              <CTableDataCell>
                <div className="fw-semibold text-success">
                  {coupon.discountType === "percentage"
                    ? `${coupon.discountValue}%`
                    : formatCurrency(coupon.discountValue, currencyOptions)}
                </div>
              </CTableDataCell>
              <CTableDataCell>
                <div className="text-xs">
                  {coupon.minOrderValue > 0 && (
                    <div>
                      {t("minOrder", {
                        value: formatCurrency(
                          coupon.minOrderValue,
                          currencyOptions,
                        ),
                      })}
                    </div>
                  )}
                  <div>
                    {t("appliesTo")}{" "}
                    <CBadge
                      color="info"
                      shape="rounded-pill"
                      className="!text-white"
                    >
                      {t(`applicableTo.${coupon.applicableTo}` as string)}
                    </CBadge>
                  </div>
                </div>
              </CTableDataCell>
              <CTableDataCell className="text-center">
                {t("usageCount", {
                  count: coupon.usageCount,
                  max: coupon.maxUsage || t("unlimited"),
                })}
              </CTableDataCell>
              <CTableDataCell>
                <div className="text-xs">
                  <div>
                    {t("starts", { date: formatDate(coupon.startDate) })}
                  </div>
                  <div>
                    {t("expires", { date: formatDate(coupon.expiryDate) })}
                  </div>
                </div>
              </CTableDataCell>
              <CTableDataCell className="text-center">
                <CTooltip
                  content={
                    status === "active"
                      ? t("statusActive")
                      : t("statusInactive")
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
                  <CTooltip content={t("editTitle")}>
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
                    <CTooltip content={t("deactivateTitle")}>
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
