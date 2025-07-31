"use client";

import { CCol, CFormInput, CFormSelect, CRow } from "@coreui/react";
import { useTranslations } from "next-intl";
import React from "react";

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterRole: string;
  setFilterRole: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
}) => {
  const t = useTranslations("AdminUsers.filters");

  return (
    <CRow className="g-3 align-items-center">
      <CCol md={4}>
        <CFormInput
          type="search"
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Tìm kiếm người dùng"
        />
      </CCol>
      <CCol md={3}>
        <CFormSelect
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          aria-label={t("filterRole")}
        >
          <option value="">{t("allRoles")}</option>
          <option value="customer">{t("customer")}</option>
          <option value="admin">{t("admin")}</option>
        </CFormSelect>
      </CCol>
      <CCol md={3}>
        <CFormSelect
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label={t("filterStatus")}
        >
          <option value="">{t("allStatuses")}</option>
          <option value="true">{t("active")}</option>
          <option value="false">{t("suspended")}</option>
        </CFormSelect>
      </CCol>
    </CRow>
  );
};

export default UserFilters;
