"use client";

import { useSettings } from "@/app/SettingsContext";
import { Coupon, CouponFormData } from "@/types";
import {
  CButton,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import ApplicableItemsSelector from "./ApplicableItemsSelector";

interface CouponFormProps {
  initialData?: Coupon;
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
  const { rates } = useSettings();
  const usdToVndRate = rates?.inverseRates?.USD || 25400;
  const [inputCurrency, setInputCurrency] = useState<"VND" | "USD">("VND");

  const [formData, setFormData] = useState<Partial<CouponFormData>>({
    code: initialData?.code || "",
    description: initialData?.description || "",
    discountType: initialData?.discountType || "percentage",
    discountValue: initialData?.discountValue || 0,
    minOrderValue: initialData?.minOrderValue || 0,
    maxUsage: initialData?.maxUsage ?? null,
    maxUsagePerUser: initialData?.maxUsagePerUser || 1,
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    expiryDate: initialData?.expiryDate
      ? new Date(initialData.expiryDate).toISOString().split("T")[0]
      : "",
    isActive: initialData?.isActive ?? true,
    applicableTo: initialData?.applicableTo || "all",
    applicableIds: initialData?.applicableIds || [],
  });

  const [displayValues, setDisplayValues] = useState({
    discountValueVND: String(initialData?.discountValue || ""),
    discountValueUSD: (
      (initialData?.discountValue || 0) / usdToVndRate
    ).toFixed(2),
    minOrderValueVND: String(initialData?.minOrderValue || "0"),
    minOrderValueUSD: (
      (initialData?.minOrderValue || 0) / usdToVndRate
    ).toFixed(2),
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialData) {
      const discountVND = initialData.discountValue || 0;
      const minOrderVND = initialData.minOrderValue || 0;
      setFormData((prev) => ({
        ...prev,
        discountValue: discountVND,
        minOrderValue: minOrderVND,
      }));
      setDisplayValues({
        discountValueVND: String(discountVND),
        discountValueUSD: (discountVND / usdToVndRate).toFixed(2),
        minOrderValueVND: String(minOrderVND),
        minOrderValueUSD: (minOrderVND / usdToVndRate).toFixed(2),
      });
    }
  }, [initialData, usdToVndRate]);

  const handleDisplayValueChange = (
    value: string,
    field: "discountValue" | "minOrderValue",
    currency: "VND" | "USD",
  ) => {
    if (field === "discountValue") {
      setDisplayValues((prev) => ({
        ...prev,
        [currency === "VND" ? "discountValueVND" : "discountValueUSD"]: value,
      }));
    } else {
      setDisplayValues((prev) => ({
        ...prev,
        [currency === "VND" ? "minOrderValueVND" : "minOrderValueUSD"]: value,
      }));
    }
  };

  const handlePriceBlur = (
    field: "discountValue" | "minOrderValue",
    currency: "VND" | "USD",
  ) => {
    let numericValue = 0;
    if (currency === "VND") {
      numericValue =
        parseFloat(
          field === "discountValue"
            ? displayValues.discountValueVND
            : displayValues.minOrderValueVND,
        ) || 0;
    } else {
      numericValue =
        parseFloat(
          field === "discountValue"
            ? displayValues.discountValueUSD
            : displayValues.minOrderValueUSD,
        ) || 0;
    }

    let finalValueInVND = 0;
    if (currency === "VND") {
      finalValueInVND = Math.round(numericValue / 1000) * 1000;
    } else {
      finalValueInVND = Math.round((numericValue * usdToVndRate) / 1000) * 1000;
    }

    setFormData((prev) => ({ ...prev, [field]: finalValueInVND }));

    const finalDiscountVND: number =
      field === "discountValue"
        ? finalValueInVND
        : Number(formData.discountValue) || 0;
    
    const finalMinOrderVND: number =
      field === "minOrderValue"
        ? finalValueInVND
        : Number(formData.minOrderValue) || 0;

    setDisplayValues({
      discountValueVND: String(finalDiscountVND),
      discountValueUSD: (finalDiscountVND / usdToVndRate).toFixed(2),
      minOrderValueVND: String(finalMinOrderVND),
      minOrderValueUSD: (finalMinOrderVND / usdToVndRate).toFixed(2),
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

  const handleApplicableIdsChange = (ids: string[]) => {
    setFormData((prev) => ({ ...prev, applicableIds: ids }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.code?.trim()) newErrors.code = "Mã code là bắt buộc.";

    const discountVal = Number(formData.discountValue);
    if (isNaN(discountVal) || discountVal <= 0)
      newErrors.discountValue = "Giá trị giảm phải là số lớn hơn 0.";
    if (formData.discountType === "percentage" && discountVal > 100)
      newErrors.discountValue = "Giảm giá % không được lớn hơn 100.";

    if (!formData.expiryDate)
      newErrors.expiryDate = "Ngày hết hạn là bắt buộc.";
    else if (
      formData.startDate &&
      new Date(formData.expiryDate) <= new Date(formData.startDate)
    ) {
      newErrors.expiryDate = "Ngày hết hạn phải sau ngày bắt đầu.";
    }

    if (
      formData.applicableTo !== "all" &&
      (!formData.applicableIds || formData.applicableIds.length === 0)
    ) {
      newErrors.applicableIds = "Vui lòng chọn ít nhất một mục.";
    }

    const maxUsage = formData.maxUsage ? Number(formData.maxUsage) : null;
    if (maxUsage !== null && (isNaN(maxUsage) || maxUsage < 0))
      newErrors.maxUsage = "Phải là số không âm.";

    const maxUsagePerUser = Number(formData.maxUsagePerUser);
    if (isNaN(maxUsagePerUser) || maxUsagePerUser < 1)
      newErrors.maxUsagePerUser = "Phải ít nhất là 1.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        ...formData,
        maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
      };
      onSubmit(payload);
    } else {
      toast.error("Vui lòng kiểm tra lại các trường có lỗi.");
    }
  };

  return (
    <CForm onSubmit={handleSubmit}>
      <div className="d-flex justify-content-end mb-4">
        <CFormLabel htmlFor="inputCurrency" className="col-form-label-sm me-2">
          Nhập giá bằng:
        </CFormLabel>
        <CFormSelect
          size="sm"
          id="inputCurrency"
          style={{ width: "150px" }}
          value={inputCurrency}
          onChange={(e) => setInputCurrency(e.target.value as "VND" | "USD")}
          aria-label="Chọn tiền tệ nhập giá"
        >
          <option value="VND">Tiền Việt (VND)</option>
          <option value="USD">Đô la Mỹ (USD)</option>
        </CFormSelect>
      </div>
      <CRow className="g-4">
        <CCol md={8}>
          <CFormLabel htmlFor="code">Mã Code *</CFormLabel>
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
          <CFormLabel htmlFor="discountType">Loại giảm giá *</CFormLabel>
          <CFormSelect
            id="discountType"
            name="discountType"
            value={formData.discountType}
            onChange={handleChange}
          >
            <option value="percentage">Phần trăm (%)</option>
            <option value="fixed_amount">Số tiền cố định</option>
          </CFormSelect>
        </CCol>
        <CCol xs={12}>
          <CFormLabel htmlFor="description">Mô tả</CFormLabel>
          <CFormInput
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
          />
        </CCol>

        {formData.discountType === "fixed_amount" ? (
          <>
            <CCol xs={12}>
              <CFormLabel>Giá trị giảm *</CFormLabel>
            </CCol>
            <CCol md={6}>
              <CInputGroup>
                <CFormInput
                  type="number"
                  placeholder="Giá trị VND"
                  value={displayValues.discountValueVND}
                  onChange={(e) =>
                    handleDisplayValueChange(
                      e.target.value,
                      "discountValue",
                      "VND",
                    )
                  }
                  onBlur={() => handlePriceBlur("discountValue", "VND")}
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
                  placeholder="Giá trị USD"
                  value={displayValues.discountValueUSD}
                  onChange={(e) =>
                    handleDisplayValueChange(
                      e.target.value,
                      "discountValue",
                      "USD",
                    )
                  }
                  onBlur={() => handlePriceBlur("discountValue", "USD")}
                  readOnly={inputCurrency !== "USD"}
                />
              </CInputGroup>
            </CCol>
          </>
        ) : (
          <CCol md={6}>
            <CFormLabel htmlFor="discountValue">Giá trị giảm (%) *</CFormLabel>
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
          <CFormLabel>Đơn hàng tối thiểu để áp dụng</CFormLabel>
        </CCol>
        <CCol md={6}>
          <CInputGroup>
            <CFormInput
              type="number"
              placeholder="Giá trị VND"
              value={displayValues.minOrderValueVND}
              onChange={(e) =>
                handleDisplayValueChange(e.target.value, "minOrderValue", "VND")
              }
              onBlur={() => handlePriceBlur("minOrderValue", "VND")}
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
              placeholder="Giá trị USD"
              value={displayValues.minOrderValueUSD}
              onChange={(e) =>
                handleDisplayValueChange(e.target.value, "minOrderValue", "USD")
              }
              onBlur={() => handlePriceBlur("minOrderValue", "USD")}
              readOnly={inputCurrency !== "USD"}
            />
          </CInputGroup>
        </CCol>

        <CCol md={6}>
          <CFormLabel htmlFor="startDate">Ngày bắt đầu</CFormLabel>
          <CFormInput
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
          />
        </CCol>
        <CCol md={6}>
          <CFormLabel htmlFor="expiryDate">Ngày hết hạn *</CFormLabel>
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
          <CFormLabel htmlFor="maxUsage">
            Tổng lượt sử dụng (trống là không giới hạn)
          </CFormLabel>
          <CFormInput
            id="maxUsage"
            name="maxUsage"
            type="number"
            value={formData.maxUsage ?? ""}
            onChange={handleChange}
            invalid={!!errors.maxUsage}
            placeholder="∞"
          />
          {errors.maxUsage && (
            <div className="text-danger mt-1 text-xs">{errors.maxUsage}</div>
          )}
        </CCol>
        <CCol md={6}>
          <CFormLabel htmlFor="maxUsagePerUser">
            Lượt sử dụng / Người dùng *
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
          <CFormLabel>Đối tượng áp dụng *</CFormLabel>
          <CFormSelect
            name="applicableTo"
            value={formData.applicableTo}
            onChange={handleChange}
          >
            <option value="all">Tất cả sản phẩm</option>
            <option value="products">Sản phẩm được chọn</option>
            <option value="categories">Danh mục được chọn</option>
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
            label="Kích hoạt mã giảm giá này"
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
          Hủy
        </CButton>
        <CButton type="submit" color="primary" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        </CButton>
      </div>
    </CForm>
  );
};

export default CouponForm;
