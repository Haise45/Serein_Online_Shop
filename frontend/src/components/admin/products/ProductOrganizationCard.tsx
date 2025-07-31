import { getLocalizedName } from "@/lib/utils";
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
import { useLocale } from "next-intl";
import React from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("AdminProductForm.organization");
  const locale = useLocale() as "vi" | "en";

  return (
    <CCard className="mb-4">
      <CCardHeader className="flex items-center gap-2">
        <CIcon icon={cilFolder} />
        {t("title")}
      </CCardHeader>
      <CCardBody>
        <div className="mb-4">
          <CFormLabel htmlFor="category">{t("categoryLabel")}</CFormLabel>
          <CFormSelect
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            invalid={!!error}
            className="mt-1"
          >
            <option value="">{t("selectCategory")}</option>
            {isLoadingCategories ? (
              <option disabled>{t("loadingCategories")}</option>
            ) : (
              categoriesForSelect.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {getLocalizedName(cat.displayName, locale)}
                </option>
              ))
            )}
          </CFormSelect>
          {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </div>
        <div>
          <CFormLabel>{t("statusLabel")}</CFormLabel>
          <div className="mt-2 space-y-3">
            <CFormSwitch
              id="isPublished"
              label={t("publishLabel")}
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="flex items-center"
            />
            <p className="-mt-2 ml-10 text-xs text-gray-500">
              {t("publishHelpText")}
            </p>
            <CFormSwitch
              id="isActive"
              label={t("activateLabel")}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="flex items-center"
            />
            <p className="-mt-2 ml-10 text-xs text-gray-500">
              {t("activateHelpText")}
            </p>
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default ProductOrganizationCard;
