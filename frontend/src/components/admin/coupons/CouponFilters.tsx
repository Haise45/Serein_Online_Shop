"use client";

import { cilFilter, cilPlus } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CButton, CCol, CFormInput, CFormSelect, CRow } from "@coreui/react";
import React from "react";
import { useTranslations } from "next-intl";

interface CouponFiltersProps {
  filters: { code: string; isActive: string; discountType: string };
  onFilterChange: (
    filterName: keyof CouponFiltersProps["filters"],
    value: string,
  ) => void;
  clearFilters: () => void;
  onAddNewClick: () => void;
}

const CouponFilters: React.FC<CouponFiltersProps> = ({
  filters,
  onFilterChange,
  clearFilters,
  onAddNewClick,
}) => {
  const t = useTranslations("AdminCoupons.filters");

  return (
    <div className="mb-4">
      <CRow className="g-3 align-items-center">
        <CCol md={3}>
          <CFormInput
            type="search"
            placeholder={t("searchPlaceholder")}
            value={filters.code}
            onChange={(e) => onFilterChange("code", e.target.value)}
          />
        </CCol>
        <CCol md={2}>
          <CFormSelect
            value={filters.discountType}
            onChange={(e) => onFilterChange("discountType", e.target.value)}
          >
            <option value="">{t("discountType")}</option>
            <option value="percentage">{t("percentage")}</option>
            <option value="fixed_amount">{t("fixedAmount")}</option>
          </CFormSelect>
        </CCol>
        <CCol md={2}>
          <CFormSelect
            value={filters.isActive}
            onChange={(e) => onFilterChange("isActive", e.target.value)}
          >
            <option value="">{t("status")}</option>
            <option value="true">{t("active")}</option>
            <option value="false">{t("inactive")}</option>
          </CFormSelect>
        </CCol>
        <CCol md="auto" className="ms-md-auto d-flex gap-2">
          <CButton color="secondary" variant="outline" onClick={clearFilters}>
            <CIcon icon={cilFilter} className="me-1" />
            {t("clearFilters")}
          </CButton>
          <CButton color="primary" onClick={onAddNewClick}>
            <CIcon icon={cilPlus} className="me-1" />
            {t("addNew")}
          </CButton>
        </CCol>
      </CRow>
    </div>
  );
};

export default CouponFilters;
