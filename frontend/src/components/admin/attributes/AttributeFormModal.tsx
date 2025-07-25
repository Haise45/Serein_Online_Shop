import LanguageSwitcherTabs from "@/components/shared/LanguageSwitcherTabs";
import { useCreateAttribute } from "@/lib/react-query/attributeQueries";
import { I18nField } from "@/types";
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
import { useTranslations } from "next-intl";

interface AttributeFormModalProps {
  visible: boolean;
  onClose: () => void;
}

const AttributeFormModal: React.FC<AttributeFormModalProps> = ({
  visible,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [label, setLabel] = useState<I18nField>({ vi: "", en: "" });
  const [editLocale, setEditLocale] = useState<"vi" | "en">("vi");
  const createAttributeMutation = useCreateAttribute();
  const t = useTranslations("AdminAttributes.attributeForm");

  const handleSave = () => {
    if (!name.trim() || !label.vi.trim() || !label.en.trim()) {
      toast.error(t("validationError"));
      return;
    }
    createAttributeMutation.mutate(
      { name, label },
      {
        onSuccess: () => {
          onClose(); // Đóng modal khi thành công
          setName(""); // Reset form
          setLabel({ vi: "", en: "" });
        },
      },
    );
  };

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>{t("title")}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div className="mb-3">
          <CFormLabel htmlFor="attrName">{t("nameLabel")}</CFormLabel>
          <CFormInput
            id="attrName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
          />
        </div>

        <hr className="my-4" />

        <LanguageSwitcherTabs
          activeLocale={editLocale}
          onLocaleChange={setEditLocale}
        />

        <div className="mb-3">
          <CFormLabel htmlFor="attrLabel">
            {t("displayLabel", { locale: editLocale })}
          </CFormLabel>
          <CFormInput
            id="attrLabel"
            value={label[editLocale]}
            onChange={(e) =>
              setLabel((prev) => ({ ...prev, [editLocale]: e.target.value }))
            }
            placeholder={t(
              `displayPlaceholder${editLocale === "en" ? "_en" : ""}`,
            )}
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>
          {t("cancel")}
        </CButton>
        <CButton
          color="primary"
          onClick={handleSave}
          disabled={createAttributeMutation.isPending}
        >
          {createAttributeMutation.isPending && (
            <CSpinner size="sm" className="mr-2" />
          )}{" "}
          {t("create")}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default AttributeFormModal;
