import { VariantFormState } from "@/app/[locale]/admin/products/create/AdminProductCreateClient";
import { useGetAdminAttributes } from "@/lib/react-query/attributeQueries";
import { ProductAttributeCreation } from "@/services/productService";
import { cilCheckCircle, cilX } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from "@coreui/react";
import classNames from "classnames";
import Image from "next/image";
import React, { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedName } from "@/lib/utils";
import { I18nField } from "@/types";

interface ProductAttributesCardProps {
  // Dữ liệu thuộc tính và biến thể hiện tại của sản phẩm
  selectedAttributes: ProductAttributeCreation[];
  variants: VariantFormState[];
  colorImages: { [colorValueId: string]: string[] }; // Key giờ là ID của giá trị màu
  errors: Record<string, string>;

  // Callbacks để tương tác với component cha
  onAttributeToggle: (attributeId: string) => void;
  onValueToggle: (attributeId: string, valueId: string) => void;
  onColorImageUpload: (
    files: File[],
    colorValueId: string,
    colorValue: string,
  ) => void;
  onRemoveColorImage: (colorValueId: string, index: number) => void;
  onGenerateAllVariantSKUs: () => void;
  onRemoveVariant: (index: number) => void;
  onVariantChange: <K extends keyof VariantFormState>(
    index: number,
    field: K,
    value: VariantFormState[K],
  ) => void;
}

const ProductAttributesCard: React.FC<ProductAttributesCardProps> = ({
  selectedAttributes,
  variants,
  colorImages,
  errors,
  onAttributeToggle,
  onValueToggle,
  onColorImageUpload,
  onRemoveColorImage,
  onGenerateAllVariantSKUs,
  onRemoveVariant,
  onVariantChange,
}) => {
  const t = useTranslations("AdminProductForm.attributes");
  const locale = useLocale() as "vi" | "en";

  // Fetch tất cả thuộc tính có sẵn trong hệ thống
  const {
    data: availableAttributes,
    isLoading: isLoadingAttributes,
    isError,
  } = useGetAdminAttributes();

  // === TẠO BỘ ĐỆM TRA CỨU (LOOKUP MAP) ĐỂ TỐI ƯU HÓA HIỆU SUẤT ===
  const attributeLookupMap = useMemo(() => {
    if (!availableAttributes)
      return new Map<string, { label: string; values: Map<string, string> }>();

    const map = new Map<
      string,
      { label: I18nField; values: Map<string, I18nField> }
    >();

    availableAttributes.forEach((attr) => {
      const valueMap = new Map<string, I18nField>();
      attr.values.forEach((val) => {
        valueMap.set(val._id, val.value);
      });
      map.set(attr._id, { label: attr.label, values: valueMap });
    });

    return map;
  }, [availableAttributes]);

  if (isLoadingAttributes)
    return (
      <CCard>
        <CCardBody className="text-center">
          <CSpinner />
        </CCardBody>
      </CCard>
    );
  if (isError)
    return (
      <CCard>
        <CCardBody className="text-danger text-center">
          {t("loadingError")}
        </CCardBody>
      </CCard>
    );

  return (
    <CCard className="mb-4">
      <CCardHeader>{t("title")}</CCardHeader>
      <CCardBody>
        {/* --- 1. CHỌN CÁC THUỘC TÍNH ĐỂ ÁP DỤNG --- */}
        <div className="mb-4">
          <h5 className="mb-2 font-semibold">{t("selectAttributes")}</h5>
          <div className="flex flex-wrap gap-3">
            {availableAttributes?.map((attr) => {
              const isSelected = selectedAttributes.some(
                (sa) => sa.attribute === attr._id,
              );
              return (
                <CButton
                  key={attr._id}
                  color={isSelected ? "success" : "secondary"}
                  variant="outline"
                  onClick={() => onAttributeToggle(attr._id)}
                >
                  {getLocalizedName(attr.label, locale)}{" "}
                  {isSelected && <CIcon icon={cilCheckCircle} />}
                </CButton>
              );
            })}
          </div>
        </div>

        {/* --- 2. CHỌN CÁC GIÁ TRỊ CHO MỖI THUỘC TÍNH ĐÃ CHỌN --- */}
        {selectedAttributes.map((selectedAttr) => {
          const fullAttribute = availableAttributes?.find(
            (a) => a._id === selectedAttr.attribute,
          );
          if (!fullAttribute) return null;

          if (fullAttribute.name === "color") {
            return (
              <div key={fullAttribute._id} className="mb-4 border-t pt-4">
                <CFormLabel className="font-semibold">
                  {getLocalizedName(fullAttribute.label, locale)}
                </CFormLabel>
                <div className="flex flex-wrap items-center gap-3">
                  {fullAttribute.values.map((value) => {
                    const isValueSelected = selectedAttr.values.includes(
                      value._id,
                    );
                    // Lấy mã màu hex, fallback về màu xám nếu không có
                    const hexColor =
                      value.meta && typeof value.meta.hex === "string"
                        ? value.meta.hex
                        : "#E2E8F0";
                    // Lấy màu viền cho các màu sáng
                    const borderColor =
                      value.meta && typeof value.meta.borderColor === "string"
                        ? value.meta.borderColor
                        : hexColor;

                    return (
                      <button
                        key={value._id}
                        type="button"
                        title={getLocalizedName(value.value, locale)}
                        onClick={() =>
                          onValueToggle(fullAttribute._id, value._id)
                        }
                        className={classNames(
                          "rounded-full p-0.5 transition-all duration-200 focus:outline-none",
                          {
                            "ring-2 ring-blue-500 ring-offset-2":
                              isValueSelected,
                          },
                        )}
                        aria-label={`Chọn màu ${value.value}`}
                      >
                        <div
                          className="h-7 w-7 rounded-full border"
                          style={{
                            backgroundColor: hexColor,
                            borderColor: borderColor,
                          }}
                        ></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          // === RENDER MẶC ĐỊNH CHO CÁC THUỘC TÍNH KHÁC (VÍ DỤ: SIZE) ===
          return (
            <div key={fullAttribute._id} className="mb-4 border-t pt-4">
              <CFormLabel className="font-semibold">
                {getLocalizedName(fullAttribute.label, locale)}
              </CFormLabel>
              <div className="flex flex-wrap gap-2">
                {fullAttribute.values.map((value) => {
                  const isValueSelected = selectedAttr.values.includes(
                    value._id,
                  );
                  return (
                    <CButton
                      key={value._id}
                      color={isValueSelected ? "primary" : "light"}
                      onClick={() =>
                        onValueToggle(fullAttribute._id, value._id)
                      }
                    >
                      {getLocalizedName(value.value, locale)}
                    </CButton>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* --- 3. UPLOAD ẢNH THEO MÀU --- */}
        {(() => {
          const colorAttribute = availableAttributes?.find(
            (a) => a.name === "color",
          );
          const selectedColorAttr =
            colorAttribute &&
            selectedAttributes.find(
              (sa) => sa.attribute === colorAttribute._id,
            );
          if (!selectedColorAttr || selectedColorAttr.values.length === 0)
            return null;

          return (
            <div className="mt-4 border-t pt-4">
              <h5 className="mb-3 font-semibold">{t("imagesByColor")}</h5>
              {selectedColorAttr.values.map((valueId) => {
                const colorValue = colorAttribute.values.find(
                  (v) => v._id === valueId,
                );
                if (!colorValue) return null;

                return (
                  <div
                    key={colorValue._id}
                    className="mb-3 rounded-lg border p-3"
                  >
                    <CFormLabel className="font-medium">
                      {t("imagesForColor", {
                        color: getLocalizedName(colorValue.value, locale),
                      })}
                    </CFormLabel>
                    <CFormInput
                      type="file"
                      multiple
                      size="sm"
                      accept="image/*"
                      className="mb-2"
                      onChange={(e) =>
                        e.target.files &&
                        onColorImageUpload(
                          Array.from(e.target.files),
                          colorValue._id,
                          getLocalizedName(colorValue.value, locale),
                        )
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      {colorImages[colorValue._id]?.map((img, index) => (
                        <div key={index} className="group relative">
                          <Image
                            src={img}
                            alt={`${colorValue.value}-${index}`}
                            width={60}
                            height={60}
                            className="rounded object-cover"
                          />
                          <CButton
                            size="sm"
                            color="danger"
                            variant="ghost"
                            className="absolute -top-1 -right-1 hidden !p-1 group-hover:block"
                            onClick={() =>
                              onRemoveColorImage(colorValue._id, index)
                            }
                          >
                            <CIcon icon={cilX} />
                          </CButton>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Phần danh sách biến thể */}
        {variants.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h5 className="m-0 font-semibold">
                {t("variantList", { count: variants.length })}
              </h5>
              <CButton
                color="secondary"
                variant="outline"
                size="sm"
                onClick={onGenerateAllVariantSKUs}
              >
                {t("generateSku")}
              </CButton>
            </div>
            <div className="space-y-3">
              {variants.map((variant, index) => {
                // --- TẠO TÊN HIỂN THỊ (DISPLAY NAME) TỪ CÁC ID ---
                const displayName = variant.optionValues
                  .map((opt) => {
                    const attrInfo = attributeLookupMap.get(opt.attribute);
                    if (!attrInfo) return "N/A"; // Fallback nếu không tìm thấy thuộc tính

                    const localizedLabel = getLocalizedName(
                      attrInfo.label,
                      locale,
                    );
                    const valueObject = attrInfo.values.get(opt.value);
                    const localizedValue = getLocalizedName(
                      valueObject,
                      locale,
                    );

                    return `${localizedLabel}: ${localizedValue}`;
                  })
                  .join(" / ");

                return (
                  <div key={index} className="border-t py-3">
                    <CRow className="g-3 align-items-center">
                      <CCol
                        md={12}
                        className="flex items-center justify-between"
                      >
                        {/* Hiển thị tên đã được xử lý */}
                        <CFormLabel className="mb-0 font-medium">
                          {t("version", { name: displayName })}
                        </CFormLabel>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveVariant(index)}
                          title={t("deleteVariant")}
                        >
                          <CIcon icon={cilX} />
                        </CButton>
                      </CCol>
                      <CCol xs={6} md={3}>
                        <CFormLabel>{t("skuLabel")}</CFormLabel>
                        <CFormInput
                          size="sm"
                          value={variant.sku}
                          onChange={(e) =>
                            onVariantChange(index, "sku", e.target.value)
                          }
                          invalid={!!errors[`variant_sku_${index}`]}
                        />
                      </CCol>
                      <CCol xs={6} md={3}>
                        <CFormLabel>{t("priceLabel")}</CFormLabel>
                        <CFormInput
                          size="sm"
                          type="number"
                          value={variant.price}
                          onChange={(e) =>
                            onVariantChange(index, "price", e.target.value)
                          }
                        />
                      </CCol>
                      <CCol xs={6} md={3}>
                        <CFormLabel>{t("salePriceLabel")}</CFormLabel>
                        <CFormInput
                          size="sm"
                          type="number"
                          value={variant.salePrice}
                          onChange={(e) =>
                            onVariantChange(index, "salePrice", e.target.value)
                          }
                        />
                      </CCol>
                      <CCol xs={6} md={3}>
                        <CFormLabel>{t("stockLabel")}</CFormLabel>
                        <CFormInput
                          size="sm"
                          type="number"
                          value={variant.stockQuantity}
                          onChange={(e) =>
                            onVariantChange(
                              index,
                              "stockQuantity",
                              e.target.value,
                            )
                          }
                        />
                      </CCol>
                    </CRow>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default ProductAttributesCard;
