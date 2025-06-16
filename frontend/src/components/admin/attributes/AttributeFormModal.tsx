import { useCreateAttribute } from "@/lib/react-query/attributeQueries";
import {
  CButton,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from "@coreui/react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface AttributeFormModalProps {
  visible: boolean;
  onClose: () => void;
}

const AttributeFormModal: React.FC<AttributeFormModalProps> = ({
  visible,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const createAttributeMutation = useCreateAttribute();

  const handleSave = () => {
    if (!name.trim() || !label.trim()) {
      toast.error("Vui lòng nhập đầy đủ Tên (key) và Nhãn (label).");
      return;
    }
    createAttributeMutation.mutate(
      { name, label },
      {
        onSuccess: () => {
          onClose(); // Đóng modal khi thành công
          setName(""); // Reset form
          setLabel("");
        },
      },
    );
  };

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>Tạo thuộc tính mới</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="mb-3">
          <CFormLabel htmlFor="attrName">
            Tên thuộc tính (key, không dấu)*
          </CFormLabel>
          <CFormInput
            id="attrName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: color, size"
          />
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="attrLabel">
            Nhãn hiển thị (label, tiếng Việt)*
          </CFormLabel>
          <CFormInput
            id="attrLabel"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ví dụ: Màu sắc, Kích thước"
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Hủy
        </CButton>
        <CButton
          color="primary"
          onClick={handleSave}
          disabled={createAttributeMutation.isPending}
        >
          {createAttributeMutation.isPending && (
            <CSpinner size="sm" className="mr-2" />
          )}{" "}
          Tạo
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default AttributeFormModal;
