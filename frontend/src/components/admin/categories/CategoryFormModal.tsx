import { CategoryFormState } from "@/app/[locale]/admin/categories/AdminCategoriesClient";
import LanguageSwitcherTabs from "@/components/shared/LanguageSwitcherTabs";
import { Category } from "@/types";
import {
  CButton,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from "@coreui/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { useState } from "react";

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditMode: boolean;
  currentCategory: CategoryFormState;
  onI18nChange: (
    field: "name" | "description",
    locale: "vi" | "en",
    value: string,
  ) => void;
  onFormChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categoriesForSelect: Category[];
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  isLoadingData?: boolean;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isEditMode,
  currentCategory,
  onI18nChange,
  onFormChange,
  onImageFileChange,
  categoriesForSelect,
  formErrors,
  isSubmitting,
  isLoadingData,
}) => {
  const t = useTranslations("AdminCategories.formModal");
  const [editLocale, setEditLocale] = useState<"vi" | "en">("vi");

  return (
    <CModal
      alignment="center"
      visible={visible}
      onClose={onClose}
      size="lg"
      backdrop="static"
    >
      <form onSubmit={onSubmit}>
        <CModalHeader>
          <CModalTitle>
            {isEditMode ? t("editTitle") : t("createTitle")}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {isLoadingData ? (
            <div className="p-10 text-center">
              <CSpinner />
            </div>
          ) : (
            <>
              <LanguageSwitcherTabs
                activeLocale={editLocale}
                onLocaleChange={setEditLocale}
              />

              <div className="mb-3">
                <CFormLabel htmlFor={`name-${editLocale}`}>
                  {t("categoryNameLabel", { locale: editLocale.toUpperCase() })}
                </CFormLabel>
                <CFormInput
                  id={`name-${editLocale}`}
                  value={currentCategory.name?.[editLocale] || ""}
                  onChange={(e) =>
                    onI18nChange("name", editLocale, e.target.value)
                  }
                  invalid={!!formErrors[`name_${editLocale}`]}
                />
                {formErrors[`name_${editLocale}`] && (
                  <div className="mt-1 text-sm text-red-500">
                    {formErrors[`name_${editLocale}`]}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <CFormLabel htmlFor={`description-${editLocale}`}>
                  {t("descriptionLabel", { locale: editLocale.toUpperCase() })}
                </CFormLabel>
                <CFormTextarea
                  id={`description-${editLocale}`}
                  value={currentCategory.description?.[editLocale] || ""}
                  onChange={(e) =>
                    onI18nChange("description", editLocale, e.target.value)
                  }
                  rows={3}
                />
              </div>

              <hr className="my-4" />

              <div className="mb-3">
                <CFormLabel htmlFor="parent">
                  {t("parentCategoryLabel")}
                </CFormLabel>
                <CFormSelect
                  id="parent"
                  name="parent"
                  value={currentCategory.parent || ""}
                  onChange={onFormChange}
                >
                  <option value="">{t("noParentOption")}</option>
                  {categoriesForSelect.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.displayName}
                    </option>
                  ))}
                </CFormSelect>
              </div>
              <div className="mb-3">
                <CFormLabel>{t("imageLabel")}</CFormLabel>
                <CFormInput
                  type="file"
                  accept="image/*"
                  onChange={onImageFileChange}
                  className="mb-2"
                />
                {currentCategory.image && (
                  <div className="mt-2">
                    <Image
                      src={currentCategory.image}
                      alt="Xem trước"
                      width={100}
                      height={100}
                      className="h-24 w-24 rounded-md border object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="mb-3">
                <CFormCheck
                  id="isActive"
                  name="isActive"
                  label={t("isActiveLabel")}
                  checked={currentCategory.isActive ?? true}
                  onChange={onFormChange}
                />
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose}>
            {t("cancelButton")}
          </CButton>
          <CButton color="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting && <CSpinner size="sm" className="mr-2" />}
            {t("saveButton")}
          </CButton>
        </CModalFooter>
      </form>
    </CModal>
  );
};

export default CategoryFormModal;
