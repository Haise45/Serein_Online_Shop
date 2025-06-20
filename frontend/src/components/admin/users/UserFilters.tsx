"use client";

import { CCol, CFormInput, CFormSelect, CRow } from "@coreui/react";

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
  return (
    <CRow className="g-3 align-items-center">
      <CCol md={4}>
        <CFormInput
          type="search"
          placeholder="Tìm theo tên, email, SĐT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Tìm kiếm người dùng"
        />
      </CCol>
      <CCol md={3}>
        <CFormSelect
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          aria-label="Lọc theo vai trò"
        >
          <option value="">Tất cả vai trò</option>
          <option value="customer">Khách hàng</option>
          <option value="admin">Quản trị viên</option>
        </CFormSelect>
      </CCol>
      <CCol md={3}>
        <CFormSelect
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Bị đình chỉ</option>
        </CFormSelect>
      </CCol>
    </CRow>
  );
};

export default UserFilters;
