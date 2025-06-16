import { AttributeValue, AttributeValueCreationData } from "@/types";
import {
  CButton,
  CCol,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from "@coreui/react";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

// Form nội bộ
interface ValueFormProps {
  initialData: AttributeValue | null;
  onSave: (data: AttributeValueCreationData) => void;
  onCancel: () => void;
  isSaving: boolean;
}
const ValueForm: React.FC<ValueFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isSaving,
}) => {
  const [value, setValue] = useState("");
  const [hex, setHex] = useState("");

  useEffect(() => {
    setValue(initialData?.value || "");
    setHex(
      initialData?.meta && typeof initialData.meta.hex === "string"
        ? initialData.meta.hex
        : "",
    );
  }, [initialData]);

  const handleSubmit = () => {
    if (!value.trim()) {
      toast.error("Tên giá trị không được để trống.");
      return;
    }
    onSave({ value, meta: { hex: hex || undefined } });
  };

  return (
    <>
      <div className="mb-3">
        <CFormLabel htmlFor="valueName">Tên giá trị*</CFormLabel>
        <CFormInput
          id="valueName"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ví dụ: Đỏ tươi, XL, Cotton..."
        />
      </div>
      <div className="mb-3">
        <CFormLabel htmlFor="valueHex">
          Mã màu Hex (tùy chọn, nếu là màu sắc)
        </CFormLabel>
        <CRow className="g-2 align-items-center">
          <CCol xs="auto">
            <CFormInput
              type="color"
              id="valueHexColor"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="h-9 !w-12"
            />
          </CCol>
          <CCol>
            <CFormInput
              id="valueHex"
              placeholder="#FF0000"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
            />
          </CCol>
        </CRow>
      </div>
      <CModalFooter className="!mt-4 !p-0">
        <CButton color="secondary" onClick={onCancel} variant="outline">
          Hủy
        </CButton>
        <CButton color="primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving && <CSpinner size="sm" className="mr-2" />}
          Lưu
        </CButton>
      </CModalFooter>
    </>
  );
};

// Modal chính
interface AttributeValueFormModalProps {
  visible: boolean;
  isEdit: boolean;
  initialData: AttributeValue | null;
  onClose: () => void;
  onSave: (data: AttributeValueCreationData) => void;
  isSaving: boolean;
}
const AttributeValueFormModal: React.FC<AttributeValueFormModalProps> = ({
  visible,
  isEdit,
  initialData,
  onClose,
  onSave,
  isSaving,
}) => {
  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>
          {isEdit ? "Chỉnh sửa giá trị" : "Thêm giá trị mới"}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <ValueForm
          initialData={initialData}
          onSave={onSave}
          onCancel={onClose}
          isSaving={isSaving}
        />
      </CModalBody>
    </CModal>
  );
};

export default AttributeValueFormModal;
