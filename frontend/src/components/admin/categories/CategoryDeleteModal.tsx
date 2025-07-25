import { getLocalizedName } from "@/lib/utils";
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
import { useLocale, useTranslations } from "next-intl";
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
  const locale = useLocale() as "vi" | "en";
  const t = useTranslations("AdminCategories.deleteModal");

  return (
    <CModal alignment="center" visible={visible} onClose={onClose}>
      <CModalHeader className="border-b-0">
        <CModalTitle className="flex items-center">
          <CIcon icon={cilWarning} className="text-warning mr-2" size="xl" />
          {t("title")}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p>
          {t.rich("confirmMessage", {
            name: category ? getLocalizedName(category.name, locale) : "",
          })}
        </p>
        <small className="text-gray-600">{t("warningMessage")}</small>
      </CModalBody>
      <CModalFooter className="border-t-0">
        <CButton color="secondary" variant="outline" onClick={onClose}>
          {t("cancelButton")}
        </CButton>
        <CButton color="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting && <CSpinner size="sm" className="mr-2" />}
          {t("confirmButton")}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default CategoryDeleteModal;
