"use client";

import { Coupon, CouponFormData } from "@/types";
import {
  CButton,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
} from "@coreui/react";
import toast from "react-hot-toast";
import ApplicableItemsSelector from "./ApplicableItemsSelector";
import { useState } from "react";

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
  const [formData, setFormData] = useState<Partial<CouponFormData>>({
    code: initialData?.code || "",
    description: initialData?.description || "",
    discountType: initialData?.discountType || "percentage",
    discountValue: initialData?.discountValue || "",
    minOrderValue: initialData?.minOrderValue || "0",
    maxUsage: initialData?.maxUsage || "",
    maxUsagePerUser: initialData?.maxUsagePerUser || "1",
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
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
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
      newErrors.applicableIds =
        "Vui lòng chọn ít nhất một sản phẩm hoặc danh mục.";
    }

    const maxUsage = formData.maxUsage ? Number(formData.maxUsage) : null;
    if (maxUsage !== null && (isNaN(maxUsage) || maxUsage < 0)) {
      newErrors.maxUsage = "Số lần sử dụng phải là số không âm.";
    }

    const maxUsagePerUser = Number(formData.maxUsagePerUser);
    if (isNaN(maxUsagePerUser) || maxUsagePerUser < 1) {
      newErrors.maxUsagePerUser = "Số lần/người dùng phải ít nhất là 1.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue) || 0,
        maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
        maxUsagePerUser: Number(formData.maxUsagePerUser) || 1,
      };
      onSubmit(payload);
    } else {
      toast.error("Vui lòng kiểm tra lại các trường có lỗi.");
    }
  };

  return (
    <CForm onSubmit={handleSubmit}>
      <CRow className="g-4">
        <CCol md={6}>
          <CFormLabel htmlFor="code">Mã Code *</CFormLabel>
          <CFormInput
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            invalid={!!errors.code}
          />
          {errors.code && (
            <div className="text-danger mt-1 text-xs">{errors.code}</div>
          )}
        </CCol>
        <CCol md={6}>
          <CFormLabel htmlFor="description">Mô tả</CFormLabel>
          <CFormInput
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </CCol>
        <CCol md={6}>
          <CFormLabel htmlFor="discountType">Loại giảm giá *</CFormLabel>
          <CFormSelect
            id="discountType"
            name="discountType"
            value={formData.discountType}
            onChange={handleChange}
          >
            <option value="percentage">Phần trăm (%)</option>
            <option value="fixed_amount">Số tiền cố định (VND)</option>
          </CFormSelect>
        </CCol>
        <CCol md={6}>
          <CFormLabel htmlFor="discountValue">Giá trị giảm *</CFormLabel>
          <CFormInput
            id="discountValue"
            name="discountValue"
            type="number"
            value={formData.discountValue}
            onChange={handleChange}
            invalid={!!errors.discountValue}
          />
          {errors.discountValue && (
            <div className="text-danger mt-1 text-xs">
              {errors.discountValue}
            </div>
          )}
        </CCol>
        <CCol md={6}>
          <CFormLabel htmlFor="minOrderValue">Đơn hàng tối thiểu</CFormLabel>
          <CFormInput
            id="minOrderValue"
            name="minOrderValue"
            type="number"
            value={formData.minOrderValue}
            onChange={handleChange}
          />
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
          />
          {errors.expiryDate && (
            <div className="text-danger mt-1 text-xs">{errors.expiryDate}</div>
          )}
        </CCol>

        <CCol md={6}>
          <CFormLabel htmlFor="maxUsage">
            Tổng lượt sử dụng (để trống là không giới hạn)
          </CFormLabel>
          <CFormInput
            id="maxUsage"
            name="maxUsage"
            type="number"
            value={formData.maxUsage ?? ""}
            onChange={handleChange}
            invalid={!!errors.maxUsage}
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
            value={formData.maxUsagePerUser}
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
