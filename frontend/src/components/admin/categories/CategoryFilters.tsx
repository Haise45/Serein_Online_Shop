import { Category } from "@/types";
import { cilPlus, cilSearch } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCol,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import React from "react";

// Định nghĩa kiểu cho giá trị filter trạng thái
type StatusFilterValue = "" | "true" | "false";

interface CategoryFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterIsActive: StatusFilterValue;
  onFilterChange: (value: StatusFilterValue) => void;
  filterParent: string;
  onParentChange: (value: string) => void;
  parentCategoryOptions: Category[];
  isLoadingParentCategories: boolean;
  onAddNew: () => void;
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterIsActive,
  onFilterChange,
  filterParent,
  onParentChange,
  parentCategoryOptions,
  isLoadingParentCategories,
  onAddNew,
}) => {
  return (
    <CRow className="g-3 items-center justify-between">
      {/* Cột Tìm kiếm */}
      <CCol md={5}>
        <CInputGroup>
          <CInputGroupText>
            <CIcon icon={cilSearch} />
          </CInputGroupText>
          <CFormInput
            placeholder="Tìm theo tên hoặc slug..."
            value={searchTerm}
            onChange={onSearchChange}
            aria-label="Tìm kiếm danh mục"
          />
        </CInputGroup>
      </CCol>

      {/* Cột Lọc theo danh mục cha */}
      <CCol md={3}>
        <CFormSelect
          value={filterParent}
          onChange={(e) => onParentChange(e.target.value)}
          disabled={isLoadingParentCategories}
        >
          <option value="">Tất cả danh mục cha</option>
          <option value="null">-Chỉ danh mục cấp cao nhất-</option>
          {isLoadingParentCategories ? (
            <option>Đang tải...</option>
          ) : (
            parentCategoryOptions.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))
          )}
        </CFormSelect>
      </CCol>

      {/* Cột Lọc Trạng thái */}
      <CCol md={2}>
        <CFormSelect
          value={filterIsActive}
          onChange={(e) => 
            onFilterChange(e.target.value as StatusFilterValue)
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Đã ẩn</option>
        </CFormSelect>
      </CCol>

      {/* Nút Thêm mới */}
      <CCol md="auto" className="ms-md-auto">
        <CButton color="primary" onClick={onAddNew} className="w-full">
          <CIcon icon={cilPlus} className="mr-2" />
          Thêm danh mục
        </CButton>
      </CCol>
    </CRow>
  );
};

export default CategoryFilters;