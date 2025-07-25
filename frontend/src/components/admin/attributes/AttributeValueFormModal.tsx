import LanguageSwitcherTabs from "@/components/shared/LanguageSwitcherTabs";
import {
  AttributeValueAdmin,
  AttributeValueCreationData,
  I18nField,
} from "@/types";
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
import { useTranslations } from "next-intl";

// Form nội bộ
interface ValueFormProps {
  initialData: AttributeValueAdmin | null;
  onSave: (data: { value: I18nField; meta?: { hex?: string } }) => void;
  onCancel: () => void;
  isSaving: boolean;
}
const ValueForm: React.FC<ValueFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isSaving,
}) => {
  const t = useTranslations("AdminAttributes.valueForm");

  const [value, setValue] = useState<I18nField>({ vi: "", en: "" });
  const [hex, setHex] = useState("");
  const [editLocale, setEditLocale] = useState<"vi" | "en">("vi");

  useEffect(() => {
    setValue(
      typeof initialData?.value === "object"
        ? initialData.value
        : { vi: "", en: "" },
    );
    setHex(
      initialData?.meta && typeof initialData.meta.hex === "string"
        ? initialData.meta.hex
        : "",
    );
  }, [initialData]);

  const handleSubmit = () => {
    if (!value.vi.trim() || !value.en.trim()) {
      toast.error(t("validationError"));
      return;
    }
    onSave({ value, meta: { hex: hex || undefined } });
  };

  return (
    <>
      <LanguageSwitcherTabs
        activeLocale={editLocale}
        onLocaleChange={setEditLocale}
      />

      <div className="mb-3">
        <CFormLabel htmlFor="valueName">
          {t("nameLabel", { locale: editLocale.toUpperCase() })}
        </CFormLabel>
        <CFormInput
          id="valueName"
          value={value[editLocale]}
          onChange={(e) =>
            setValue((prev) => ({ ...prev, [editLocale]: e.target.value }))
          }
          placeholder={t("nameLabel", { locale: editLocale.toUpperCase() })}
        />
      </div>
      <div className="mb-3">
        <CFormLabel htmlFor="valueHex">{t("hexLabel")}</CFormLabel>
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
              placeholder={t("hexPlaceholder")}
              value={hex}
              onChange={(e) => setHex(e.target.value)}
            />
          </CCol>
        </CRow>
      </div>
      <CModalFooter className="!mt-4 !p-0">
        <CButton color="secondary" onClick={onCancel} variant="outline">
          {t("cancel")}
        </CButton>
        <CButton color="primary" onClick={handleSubmit} disabled={isSaving}>
          {isSaving && <CSpinner size="sm" className="mr-2" />}
          {t("save")}
        </CButton>
      </CModalFooter>
    </>
  );
};

// Modal chính
interface AttributeValueFormModalProps {
  visible: boolean;
  isEdit: boolean;
  initialData: AttributeValueAdmin | null;
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
  const t = useTranslations("AdminAttributes.valueForm");

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>{isEdit ? t("editTitle") : t("addTitle")}</CModalTitle>
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
