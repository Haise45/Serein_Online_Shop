"use client";

import { ORDER_STATUSES } from "@/constants/orderConstants";
import { cilFilterX } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CButton, CCol, CFormInput, CFormSelect, CRow } from "@coreui/react";
import React from "react";

interface OrderFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterStartDate: string;
  setFilterStartDate: (value: string) => void;
  filterEndDate: string;
  setFilterEndDate: (value: string) => void;
  clearFilters: () => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  clearFilters,
}) => {
  return (
    <div className="mb-4">
      <CRow className="gy-3 gx-3 align-items-center">
        {/* Search */}
        <CCol xs={12} md={3}>
          <CFormInput
            type="search"
            size="sm"
            placeholder="Tìm theo Mã đơn, Tên, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-gray-300"
          />
        </CCol>

        {/* Status */}
        <CCol xs={12} sm={6} md={3}>
          <CFormSelect
            size="sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-gray-300"
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </CFormSelect>
        </CCol>

        {/* Date Range */}
        <CCol xs={12} sm={6} md={2}>
          <CFormInput
            type="date"
            size="sm"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="border-gray-300"
            aria-label="Ngày bắt đầu"
          />
        </CCol>
        <CCol xs={12} sm={6} md={2}>
          <CFormInput
            type="date"
            size="sm"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="border-gray-300"
            aria-label="Ngày kết thúc"
          />
        </CCol>

        {/* Clear Filters Button */}
        <CCol xs={12} md="auto" className="ms-md-auto">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            title="Xóa bộ lọc"
            className="w-md-auto w-100 px-3"
          >
            <CIcon icon={cilFilterX} className="me-1" />
            Xóa lọc
          </CButton>
        </CCol>
      </CRow>
    </div>
  );
};

export default OrderFilters;
