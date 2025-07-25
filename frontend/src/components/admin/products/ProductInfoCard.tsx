import {
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormLabel,
  CSpinner,
} from "@coreui/react";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import LanguageSwitcherTabs from "@/components/shared/LanguageSwitcherTabs";
import { useTranslations, useLocale } from "next-intl";

// Tải động CustomEditor và định nghĩa component Loading ngay tại đây
const CustomEditor = dynamic(() => import("@/components/shared/CustomEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[342px] items-center justify-center rounded-lg border bg-gray-50">
      <CSpinner size="sm" />
      <span className="ml-2 text-gray-400">Loading...</span>
    </div>
  ),
});

// Định nghĩa kiểu cho các trường đa ngôn ngữ
interface I18nField {
  vi: string;
  en: string;
}

interface ProductInfoCardProps {
  name: I18nField;
  description: I18nField;
  onFieldChange: (
    field: "name" | "description",
    locale: "vi" | "en",
    value: string,
  ) => void;
  errors: {
    name_vi?: string;
    name_en?: string;
  };
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  name,
  description,
  onFieldChange,
  errors,
}) => {
  const t = useTranslations("AdminProductForm.productInfo");
  const locale = useLocale() as "vi" | "en";
  const [editLocale, setEditLocale] = useState<"vi" | "en">(locale);

  return (
    <CCard className="mb-4 shadow-sm">
      <CCardHeader className="!p-4">
        <h5 className="mb-1 font-semibold">{t("title")}</h5>
        <p className="mb-0 text-sm text-gray-500">{t("subtitle")}</p>
      </CCardHeader>
      <CCardBody className="!p-4">
        {/* Component chuyển đổi ngôn ngữ */}
        <LanguageSwitcherTabs
          activeLocale={editLocale}
          onLocaleChange={setEditLocale}
        />

        {/* Nội dung sẽ thay đổi dựa trên editLocale */}
        <div>
          {/* Tên sản phẩm */}
          <div className="mb-4">
            <CFormLabel htmlFor={`name-${editLocale}`} className="font-medium">
              {t("nameLabel", { locale: editLocale.toUpperCase() })}
            </CFormLabel>
            <CFormInput
              id={`name-${editLocale}`}
              value={name[editLocale]}
              onChange={(e) =>
                onFieldChange("name", editLocale, e.target.value)
              }
              invalid={!!errors[`name_${editLocale}` as keyof typeof errors]}
              placeholder={t("namePlaceholder", { placeholder: editLocale === "vi" ? "Áo Polo Thể Thao" : "Sport Polo Shirt" })}
              className="mt-1"
            />
            {errors[`name_${editLocale}` as keyof typeof errors] && (
              <div className="mt-1 text-sm text-red-600">
                {errors[`name_${editLocale}` as keyof typeof errors]}
              </div>
            )}
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <CFormLabel
              htmlFor={`description-${editLocale}`}
              className="font-medium"
            >
              {t("descriptionLabel", { locale: editLocale.toUpperCase() })}
            </CFormLabel>
            <div className="mt-1">
              {/* Sử dụng key để ép CKEditor re-render khi đổi ngôn ngữ */}
              <CustomEditor
                key={editLocale}
                initialData={description[editLocale]}
                onChange={(data) =>
                  onFieldChange("description", editLocale, data)
                }
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">{t("descriptionHelpText")}</p>
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default ProductInfoCard;
