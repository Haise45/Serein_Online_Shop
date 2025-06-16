import { Category } from "@/types";
import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from "@coreui/react";
import React from "react";

interface CategoryDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category: Category | null;
  isDeleting: boolean;
}

const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  visible,
  onClose,
  onConfirm,
  category,
  isDeleting,
}) => {
  return (
    <CModal alignment="center" visible={visible} onClose={onClose}>
      <CModalHeader className="border-b-0">
        <CModalTitle className="flex items-center">
          <CIcon icon={cilWarning} className="text-warning mr-2" size="xl" />
          Xác nhận xóa
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        Bạn có chắc chắn muốn xóa (ẩn) danh mục{" "}
        <strong>{category?.name}</strong>? <br />
        <small className="text-gray-600">
          Hành động này chỉ thực hiện được khi danh mục không chứa sản phẩm hoặc
          danh mục con nào đang hoạt động.
        </small>
      </CModalBody>
      <CModalFooter className="border-t-0">
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Hủy
        </CButton>
        <CButton color="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting && <CSpinner size="sm" className="mr-2" />}
          Đồng ý xóa
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default CategoryDeleteModal;
