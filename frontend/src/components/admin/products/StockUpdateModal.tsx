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

interface StockUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (update: { change?: number; set?: number }) => void;
  isSaving: boolean;
  itemName: string; // Tên sản phẩm hoặc biến thể
  currentStock: number;
}

const StockUpdateModal: React.FC<StockUpdateModalProps> = ({
  visible,
  onClose,
  onSave,
  isSaving,
  itemName,
  currentStock,
}) => {
  const [changeAmount, setChangeAmount] = useState<string>("");
  const [setAmount, setSetAmount] = useState<string>("");

  const handleSave = () => {
    if (setAmount.trim() !== "") {
      onSave({ set: Number(setAmount) });
    } else if (changeAmount.trim() !== "") {
      onSave({ change: Number(changeAmount) });
    }
  };

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>Cập nhật tồn kho cho: {itemName}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>
          Tồn kho hiện tại: <strong>{currentStock}</strong>
        </p>
        <div className="mb-3">
          <CFormLabel htmlFor="setStock">Đặt số lượng mới</CFormLabel>
          <CFormInput
            id="setStock"
            type="number"
            placeholder="Ví dụ: 100"
            value={setAmount}
            onChange={(e) => {
              setSetAmount(e.target.value);
              setChangeAmount("");
            }}
          />
        </div>
        <div className="font-weight-bold my-2 text-center">HOẶC</div>
        <div className="mb-3">
          <CFormLabel htmlFor="changeStock">
            Thay đổi một lượng (+/-)
          </CFormLabel>
          <CFormInput
            id="changeStock"
            type="number"
            placeholder="Ví dụ: 5 (thêm 5) hoặc -10 (bớt 10)"
            value={changeAmount}
            onChange={(e) => {
              setChangeAmount(e.target.value);
              setSetAmount("");
            }}
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Hủy
        </CButton>
        <CButton
          color="primary"
          onClick={handleSave}
          disabled={
            isSaving || (changeAmount.trim() === "" && setAmount.trim() === "")
          }
        >
          {isSaving && <CSpinner size="sm" className="mr-2" />}
          Lưu thay đổi
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default StockUpdateModal;
