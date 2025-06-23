import { Category } from "@/types";
import { cilFolder } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CFormLabel,
  CFormSelect,
  CFormSwitch,
} from "@coreui/react";
import React from "react";

interface ProductOrganizationCardProps {
  category: string;
  setCategory: (value: string) => void;
  isPublished: boolean;
  setIsPublished: (value: boolean) => void;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  categoriesForSelect: (Category & { displayName?: string })[];
  isLoadingCategories: boolean;
  error?: string;
}

const ProductOrganizationCard: React.FC<ProductOrganizationCardProps> = ({
  category,
  setCategory,
  isPublished,
  setIsPublished,
  isActive,
  setIsActive,
  categoriesForSelect,
  isLoadingCategories,
  error,
}) => {
  return (
    <CCard className="mb-4">
      <CCardHeader className="flex items-center gap-2">
        <CIcon icon={cilFolder} />
        Tổ chức sản phẩm
      </CCardHeader>
      <CCardBody>
        <div className="mb-4">
          <CFormLabel htmlFor="category">Danh mục*</CFormLabel>
          <CFormSelect
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            invalid={!!error}
            className="mt-1"
          >
            <option value="">Chọn danh mục</option>
            {isLoadingCategories ? (
              <option disabled>Đang tải danh mục...</option>
            ) : (
              categoriesForSelect.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.displayName}
                </option>
              ))
            )}
          </CFormSelect>
          {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </div>
        <div>
          <CFormLabel>Trạng thái</CFormLabel>
          <div className="mt-2 space-y-3">
            <CFormSwitch
              id="isPublished"
              label="Công khai sản phẩm"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="flex items-center"
            />
             <p className="-mt-2 ml-12 text-xs text-gray-500">Khi bật, sản phẩm sẽ hiển thị cho khách hàng.</p>
            <CFormSwitch
              id="isActive"
              label="Kích hoạt kinh doanh"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="flex items-center"
            />
            <p className="-mt-2 ml-12 text-xs text-gray-500">Khi tắt, sản phẩm sẽ bị ẩn và không thể mua.</p>
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default ProductOrganizationCard;