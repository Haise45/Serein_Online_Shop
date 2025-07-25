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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("AdminProducts.stockModal");
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
        <CModalTitle>{t("title", { name: itemName })}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>
          {t.rich("currentStock", {
            stock: currentStock,
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <div className="mb-3">
          <CFormLabel htmlFor="setStock">{t("setNewLabel")}</CFormLabel>
          <CFormInput
            id="setStock"
            type="number"
            placeholder={t("setNewPlaceholder")}
            value={setAmount}
            onChange={(e) => {
              setSetAmount(e.target.value);
              setChangeAmount("");
            }}
          />
        </div>
        <div className="font-weight-bold my-2 text-center">{t("or")}</div>
        <div className="mb-3">
          <CFormLabel htmlFor="changeStock">{t("changeLabel")}</CFormLabel>
          <CFormInput
            id="changeStock"
            type="number"
            placeholder={t("changePlaceholder")}
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
          {t("cancelButton")}
        </CButton>
        <CButton
          color="primary"
          onClick={handleSave}
          disabled={
            isSaving || (changeAmount.trim() === "" && setAmount.trim() === "")
          }
        >
          {isSaving && <CSpinner size="sm" className="mr-2" />}
          {t("saveButton")}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default StockUpdateModal;
