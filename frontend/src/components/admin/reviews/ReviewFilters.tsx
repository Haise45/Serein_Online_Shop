"use client";

import { cilFilterX } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CButton, CCol, CFormInput, CFormSelect, CRow } from "@coreui/react";
import React from "react";

interface ReviewFiltersProps {
  filters: {
    isApproved: string;
    rating: string;
    searchComment: string;
  };
  onFilterChange: (
    filterName: keyof ReviewFiltersProps["filters"],
    value: string,
  ) => void;
  clearFilters: () => void;
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  filters,
  onFilterChange,
  clearFilters,
}) => {
  return (
    <div>
      <CRow className="g-3 align-items-center">
        <CCol md={5}>
          <CFormInput
            size="sm"
            placeholder="Tìm theo nội dung bình luận..."
            value={filters.searchComment}
            onChange={(e) => onFilterChange("searchComment", e.target.value)}
          />
        </CCol>
        <CCol md={3}>
          <CFormSelect
            size="sm"
            value={filters.isApproved}
            onChange={(e) => onFilterChange("isApproved", e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đã duyệt</option>
            <option value="false">Chờ duyệt</option>
          </CFormSelect>
        </CCol>
        <CCol md={2}>
          <CFormSelect
            size="sm"
            value={filters.rating}
            onChange={(e) => onFilterChange("rating", e.target.value)}
          >
            <option value="">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map((star) => (
              <option key={star} value={star}>
                {star} sao
              </option>
            ))}
          </CFormSelect>
        </CCol>
        <CCol md="auto" className="ms-md-auto">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            title="Xóa bộ lọc"
          >
            <CIcon icon={cilFilterX} className="me-1" />
            Xóa lọc
          </CButton>
        </CCol>
      </CRow>
    </div>
  );
};

export default ReviewFilters;
