"use client";

import { useSettings } from "@/app/SettingsContext";
import LanguageSwitcherTabs from "@/components/shared/LanguageSwitcherTabs";
import { CouponAdmin, CouponFormData, CouponApplicableTo } from "@/types";
import {
  CButton,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ApplicableItemsSelector from "./ApplicableItemsSelector";
import { useTranslations } from "next-intl";

interface CouponFormProps {
  initialData?: CouponAdmin;
  onSubmit: (data: Partial<CouponFormData>) => void;
  isSubmitting: boolean;
  onClose: () => void;
}

type FormErrors = Partial<Record<keyof CouponFormData, string>>;

const CouponForm: React.FC<CouponFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  onClose,
}) => {
  const t = useTranslations("AdminCoupons.form");
  const { rates } = useSettings();
  const usdToVndRate = rates?.inverseRates?.USD || 25400;
  const vndToUsdRate = rates?.rates?.USD || 1 / 25400;
  const [editLocale, setEditLocale] = useState<"vi" | "en">("vi");
  const [inputCurrency, setInputCurrency] = useState<"VND" | "USD">("VND");

  const [formData, setFormData] = useState<Partial<CouponFormData>>({
    code: "",
    description: { vi: "", en: "" },
    discountType: "percentage",
    discountValue: 0,
    minOrderValue: 0,
    maxUsage: null,
    maxUsagePerUser: 1,
    startDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    isActive: true,
    applicableTo: "all",
    applicableIds: [],
  });

  const [displayValues, setDisplayValues] = useState({
    discountValueVND: "",
    discountValueUSD: "",
    minOrderValueVND: "0",
    minOrderValueUSD: "0",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialData) {
      const discountVND = initialData.discountValue || 0;
      const minOrderVND = initialData.minOrderValue || 0;
      setFormData({
        code: initialData.code,
        description: initialData.description || { vi: "", en: "" },
        discountType: initialData.discountType,
        discountValue: discountVND,
        minOrderValue: minOrderVND,
        maxUsage: initialData.maxUsage,
        maxUsagePerUser: initialData.maxUsagePerUser,
        startDate: initialData.startDate
          ? new Date(initialData.startDate).toISOString().split("T")[0]
          : "",
        expiryDate: initialData.expiryDate
          ? new Date(initialData.expiryDate).toISOString().split("T")[0]
          : "",
        isActive: initialData.isActive,
        applicableTo: initialData.applicableTo,
        applicableIds: initialData.applicableIds,
      });
      setDisplayValues({
        discountValueVND: String(discountVND),
        discountValueUSD: (discountVND * vndToUsdRate).toFixed(2),
        minOrderValueVND: String(minOrderVND),
        minOrderValueUSD: (minOrderVND * vndToUsdRate).toFixed(2),
      });
    }
  }, [initialData, vndToUsdRate]);

  const handlePriceChange = (
    value: string,
    field: "discountValue" | "minOrderValue",
  ) => {
    const numericValue = parseFloat(value) || 0;
    let valueInVND = 0;
    if (inputCurrency === "VND") {
      valueInVND = numericValue;
    } else {
      valueInVND = numericValue * usdToVndRate;
    }
    setFormData((prev) => ({ ...prev, [field]: valueInVND }));
  };

  useEffect(() => {
    const discountVND = Number(formData.discountValue) || 0;
    const minOrderVND = Number(formData.minOrderValue) || 0;
    setDisplayValues({
      discountValueVND: String(discountVND),
      discountValueUSD: (discountVND * vndToUsdRate).toFixed(2),
      minOrderValueVND: String(minOrderVND),
      minOrderValueUSD: (minOrderVND * vndToUsdRate).toFixed(2),
    });
  }, [formData.discountValue, formData.minOrderValue, vndToUsdRate]);

  const handleI18nChange = (
    field: "description",
    locale: "vi" | "en",
    value: string,
  ) => {
    setFormData((prev) => {
      const currentI18nField = prev[field] || { vi: "", en: "" };
      const newI18nField = { ...currentI18nField, [locale]: value };
      return { ...prev, [field]: newI18nField };
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleApplicableToChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newApplicableTo = e.target.value as CouponApplicableTo;

    // Cập nhật applicableTo VÀ RESET các lựa chọn cũ
    setFormData((prev) => ({
      ...prev,
      applicableTo: newApplicableTo,
      applicableIds: [], // Reset mảng ID
    }));
  };

  const handleApplicableIdsChange = (ids: string[]) => {
    setFormData((prev) => ({ ...prev, applicableIds: ids }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.code?.trim()) newErrors.code = t("validation.codeRequired");

    const discountVal = Number(formData.discountValue);
    if (isNaN(discountVal) || discountVal <= 0)
      newErrors.discountValue = t("validation.valuePositive");
    if (formData.discountType === "percentage" && discountVal > 100)
      newErrors.discountValue = t("validation.valuePercentageLimit");

    if (!formData.expiryDate)
      newErrors.expiryDate = t("validation.expiryDateRequired");
    else if (
      formData.startDate &&
      new Date(formData.expiryDate) <= new Date(formData.startDate)
    ) {
      newErrors.expiryDate = t("validation.expiryDateAfterStart");
    }

    if (
      formData.applicableTo !== "all" &&
      (!formData.applicableIds || formData.applicableIds.length === 0)
    ) {
      newErrors.applicableIds = t("validation.applicableIdsRequired");
    }

    const maxUsage = formData.maxUsage ? Number(formData.maxUsage) : null;
    if (maxUsage !== null && (isNaN(maxUsage) || maxUsage < 0))
      newErrors.maxUsage = t("validation.maxUsageInvalid");

    const maxUsagePerUser = Number(formData.maxUsagePerUser);
    if (isNaN(maxUsagePerUser) || maxUsagePerUser < 1)
      newErrors.maxUsagePerUser = t("validation.maxUsagePerUserInvalid");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const payload: Partial<CouponFormData> = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue),
        maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
        maxUsagePerUser: Number(formData.maxUsagePerUser),
      };
      onSubmit(payload);
    } else {
      toast.error(t("validation.formError"));
    }
  };

  return (
    <CForm onSubmit={handleSubmit}>
      <div className="d-flex justify-content-end mb-4">
        <CFormLabel htmlFor="inputCurrency" className="col-form-label-sm me-2">
          {t("enterPriceBy")}
        </CFormLabel>
        <CFormSelect
          size="sm"
          id="inputCurrency"
          style={{ width: "150px" }}
          value={inputCurrency}
          onChange={(e) => setInputCurrency(e.target.value as "VND" | "USD")}
          aria-label="Chọn tiền tệ nhập giá"
        >
          <option value="VND">{t("enterPriceVND")}</option>
          <option value="USD">{t("enterPriceUSD")}</option>
        </CFormSelect>
      </div>
      <CRow className="g-4">
        <CCol md={8}>
          <CFormLabel htmlFor="code">{t("codeLabel")}</CFormLabel>
          <CFormInput
            id="code"
            name="code"
            value={formData.code || ""}
            onChange={handleChange}
            invalid={!!errors.code}
            autoComplete="off"
          />
          {errors.code && (
            <div className="text-danger mt-1 text-xs">{errors.code}</div>
          )}
        </CCol>
        <CCol md={4}>
          <CFormLabel htmlFor="discountType">{t("typeLabel")}</CFormLabel>
          <CFormSelect
            id="discountType"
            name="discountType"
            value={formData.discountType}
            onChange={handleChange}
          >
            <option value="percentage">{t("typePercentage")}</option>
            <option value="fixed_amount">{t("typeFixedAmount")}</option>
          </CFormSelect>
        </CCol>
        <CCol xs={12}>
          <LanguageSwitcherTabs
            activeLocale={editLocale}
            onLocaleChange={setEditLocale}
          />
          <div className="mt-3">
            <CFormLabel htmlFor="description">
              {t("descriptionLabel", { locale: editLocale.toUpperCase() })}
            </CFormLabel>
            <CFormTextarea
              id="description"
              value={formData.description?.[editLocale] || ""}
              onChange={(e) =>
                handleI18nChange("description", editLocale, e.target.value)
              }
            />
          </div>
        </CCol>

        {formData.discountType === "fixed_amount" ? (
          <>
            <CCol xs={12}>
              <CFormLabel>{t("valueLabel")}</CFormLabel>
            </CCol>
            <CCol md={6}>
              <CInputGroup>
                <CFormInput
                  type="number"
                  value={displayValues.discountValueVND}
                  onChange={(e) =>
                    handlePriceChange(e.target.value, "discountValue")
                  }
                  readOnly={inputCurrency !== "VND"}
                  invalid={!!errors.discountValue}
                />
                <CInputGroupText>VND</CInputGroupText>
              </CInputGroup>
            </CCol>
            <CCol md={6}>
              <CInputGroup>
                <CInputGroupText>$</CInputGroupText>
                <CFormInput
                  type="number"
                  step="0.01"
                  value={displayValues.discountValueUSD}
                  onChange={(e) =>
                    handlePriceChange(e.target.value, "discountValue")
                  }
                  readOnly={inputCurrency !== "USD"}
                />
              </CInputGroup>
            </CCol>
          </>
        ) : (
          <CCol md={6}>
            <CFormLabel htmlFor="discountValue">
              {t("valuePercentageLabel")}
            </CFormLabel>
            <CInputGroup>
              <CFormInput
                id="discountValue"
                name="discountValue"
                type="number"
                value={String(formData.discountValue)}
                onChange={handleChange}
                invalid={!!errors.discountValue}
              />
              <CInputGroupText>%</CInputGroupText>
            </CInputGroup>
          </CCol>
        )}
        {errors.discountValue && (
          <CCol xs={12}>
            <div className="text-danger mt-1 text-xs">
              {errors.discountValue}
            </div>
          </CCol>
        )}

        <CCol xs={12}>
          <CFormLabel>{t("minOrderLabel")}</CFormLabel>
        </CCol>
        <CCol md={6}>
          <CInputGroup>
            <CFormInput
              type="number"
              placeholder={t("priceVNDPlaceholder")}
              value={displayValues.minOrderValueVND}
              onChange={(e) =>
                handlePriceChange(e.target.value, "minOrderValue")
              }
              readOnly={inputCurrency !== "VND"}
            />
            <CInputGroupText>VND</CInputGroupText>
          </CInputGroup>
        </CCol>
        <CCol md={6}>
          <CInputGroup>
            <CInputGroupText>$</CInputGroupText>
            <CFormInput
              type="number"
              step="0.01"
              placeholder={t("priceUSDPlaceholder")}
              value={displayValues.minOrderValueUSD}
              onChange={(e) =>
                handlePriceChange(e.target.value, "minOrderValue")
              }
              readOnly={inputCurrency !== "USD"}
            />
          </CInputGroup>
        </CCol>

        <CCol md={6}>
          <CFormLabel htmlFor="startDate">{t("startDateLabel")}</CFormLabel>
          <CFormInput
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
          />
        </CCol>
        <CCol md={6}>
          <CFormLabel htmlFor="expiryDate">{t("expiryDateLabel")}</CFormLabel>
          <CFormInput
            id="expiryDate"
            name="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={handleChange}
            invalid={!!errors.expiryDate}
            min={formData.startDate}
          />
          {errors.expiryDate && (
            <div className="text-danger mt-1 text-xs">{errors.expiryDate}</div>
          )}
        </CCol>

        <CCol md={6}>
          <CFormLabel htmlFor="maxUsage">{t("totalUsageLabel")}</CFormLabel>
          <CFormInput
            id="maxUsage"
            name="maxUsage"
            type="number"
            value={formData.maxUsage ?? ""}
            onChange={handleChange}
            invalid={!!errors.maxUsage}
            placeholder={t("totalUsagePlaceholder")}
          />
          {errors.maxUsage && (
            <div className="text-danger mt-1 text-xs">{errors.maxUsage}</div>
          )}
        </CCol>
        <CCol md={6}>
          <CFormLabel htmlFor="maxUsagePerUser">
            {t("usagePerUserLabel")}
          </CFormLabel>
          <CFormInput
            id="maxUsagePerUser"
            name="maxUsagePerUser"
            type="number"
            value={String(formData.maxUsagePerUser)}
            onChange={handleChange}
            invalid={!!errors.maxUsagePerUser}
          />
          {errors.maxUsagePerUser && (
            <div className="text-danger mt-1 text-xs">
              {errors.maxUsagePerUser}
            </div>
          )}
        </CCol>

        <CCol md={12}>
          <CFormLabel>{t("applicableToLabel")}</CFormLabel>
          <CFormSelect
            name="applicableTo"
            value={formData.applicableTo}
            onChange={handleApplicableToChange}
          >
            <option value="all">{t("applicableToAll")}</option>
            <option value="products">{t("applicableToProducts")}</option>
            <option value="categories">{t("applicableToCategories")}</option>
          </CFormSelect>
        </CCol>
        {formData.applicableTo !== "all" && (
          <CCol md={12}>
            <ApplicableItemsSelector
              type={formData.applicableTo!}
              value={formData.applicableIds || []}
              onChange={handleApplicableIdsChange}
              initialDetails={initialData?.applicableDetails}
            />
            {errors.applicableIds && (
              <div className="text-danger mt-1 text-xs">
                {errors.applicableIds}
              </div>
            )}
          </CCol>
        )}

        <CCol md={12}>
          <CFormCheck
            id="isActive"
            name="isActive"
            label={t("activateLabel")}
            checked={formData.isActive}
            onChange={handleChange}
          />
        </CCol>
      </CRow>
      <div className="mt-4 border-t pt-3 text-end">
        <CButton
          type="button"
          color="secondary"
          onClick={onClose}
          className="me-2"
        >
          {t("cancel")}
        </CButton>
        <CButton type="submit" color="primary" disabled={isSubmitting}>
          {isSubmitting ? t("saving") : t("save")}
        </CButton>
      </div>
    </CForm>
  );
};

export default CouponForm;
