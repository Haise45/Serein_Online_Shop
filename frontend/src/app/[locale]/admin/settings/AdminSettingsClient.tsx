"use client";

import { useSettings } from "@/app/SettingsContext";
import { useUpdateSettings } from "@/lib/react-query/settingQueries";
import { Setting } from "@/types";
import {
  CButton,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
} from "@coreui/react";
import { useEffect, useState } from "react";

export default function AdminSettingsClient() {
  const { settings: initialSettings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  // State riêng cho form để tránh re-render không cần thiết khi gõ
  const [formData, setFormData] = useState<Partial<Setting>>({});

  // Đồng bộ form state với dữ liệu từ context khi nó được tải lần đầu hoặc thay đổi
  useEffect(() => {
    if (initialSettings) {
      setFormData(initialSettings);
    }
  }, [initialSettings]);

  // Handler chung cho việc thay đổi input
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Xử lý các trường lồng nhau, ví dụ: name="landingPage.maxFeaturedProducts"
    if (name.includes(".")) {
      const [section, key] = name.split(".");

      // Đảm bảo section là một key hợp lệ của Setting type
      if (section in formData) {
        setFormData((prev) => ({
          ...prev,
          [section]: {
            // Giữ lại các giá trị cũ trong section
            ...(prev[section as keyof typeof prev] as object),
            // Cập nhật giá trị mới
            [key]: value === "" ? 0 : Number(value), // Chuyển đổi sang số
          },
        }));
      }
    } else {
      // Xử lý các trường ở cấp độ gốc
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lọc ra các trường không cần thiết trước khi gửi
    const { ...payload } = formData;
    updateSettingsMutation.mutate(payload);
  };

  // Hiển thị màn hình loading nếu chưa có dữ liệu cài đặt ban đầu
  if (isLoading || !initialSettings || Object.keys(formData).length === 0) {
    return (
      <div className="p-10 text-center">
        <CSpinner />
        <p className="text-muted mt-2">Đang tải cài đặt...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <CCard className="shadow-sm">
        <CCardHeader>
          <h5 className="mb-0 font-semibold">Cấu hình hệ thống</h5>
        </CCardHeader>
        <CCardBody className="space-y-8 p-4 md:p-6">
          {/* --- CÀI ĐẶT CHUNG --- */}
          <section>
            <h6 className="mb-4 border-b pb-2 text-lg font-bold text-gray-700">
              Cài đặt chung
            </h6>
            <CRow className="g-4">
              <CCol md={6} lg={4}>
                <CFormLabel htmlFor="defaultLanguage">
                  Ngôn ngữ mặc định
                </CFormLabel>
                <CFormSelect
                  id="defaultLanguage"
                  name="defaultLanguage"
                  value={formData.defaultLanguage}
                  onChange={handleInputChange}
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh (English)</option>
                </CFormSelect>
              </CCol>
              <CCol md={6} lg={4}>
                <CFormLabel htmlFor="defaultCurrency">
                  Tiền tệ mặc định
                </CFormLabel>
                <CFormSelect
                  id="defaultCurrency"
                  name="defaultCurrency"
                  value={formData.defaultCurrency}
                  onChange={handleInputChange}
                >
                  <option value="VND">Việt Nam Đồng (VND)</option>
                  <option value="USD">US Dollar (USD)</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </section>

          {/* --- CÀI ĐẶT GIAO DIỆN CLIENT --- */}
          <section>
            <h6 className="mb-4 border-b pb-2 text-lg font-bold text-gray-700">
              Giao diện người dùng (Client)
            </h6>
            <CRow className="g-4">
              <CCol md={6} lg={4}>
                <CFormLabel htmlFor="maxFeaturedProducts">
                  Số sản phẩm nổi bật (Trang chủ)
                </CFormLabel>
                <CFormInput
                  type="number"
                  name="landingPage.maxFeaturedProducts"
                  value={formData.landingPage?.maxFeaturedProducts ?? ""}
                  onChange={handleInputChange}
                  min={1}
                />
              </CCol>
              <CCol md={6} lg={4}>
                <CFormLabel htmlFor="maxNewestProducts">
                  Số sản phẩm mới nhất (Trang chủ)
                </CFormLabel>
                <CFormInput
                  type="number"
                  name="landingPage.maxNewestProducts"
                  value={formData.landingPage?.maxNewestProducts ?? ""}
                  onChange={handleInputChange}
                  min={1}
                />
              </CCol>
              <CCol md={6} lg={4}>
                <CFormLabel htmlFor="defaultProductsPerPage">
                  Số sản phẩm/trang (Trang danh sách)
                </CFormLabel>
                <CFormInput
                  type="number"
                  name="productListPage.defaultProductsPerPage"
                  value={formData.productListPage?.defaultProductsPerPage ?? ""}
                  onChange={handleInputChange}
                  min={1}
                />
              </CCol>
            </CRow>
          </section>

          {/* --- CÀI ĐẶT GIAO DIỆN ADMIN --- */}
          <section>
            <h6 className="mb-4 border-b pb-2 text-lg font-bold text-gray-700">
              Giao diện Quản trị (Admin)
            </h6>
            <CRow className="g-4">
              <CCol md={6} lg={4}>
                <CFormLabel htmlFor="defaultItemsPerPage">
                  Số dòng/trang trong bảng dữ liệu
                </CFormLabel>
                <CFormInput
                  type="number"
                  name="adminTable.defaultItemsPerPage"
                  value={formData.adminTable?.defaultItemsPerPage ?? ""}
                  onChange={handleInputChange}
                  min={1}
                />
              </CCol>
            </CRow>
          </section>
        </CCardBody>
        <CCardFooter className="bg-light p-3 text-end">
          <CButton
            type="submit"
            color="primary"
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </CButton>
        </CCardFooter>
      </CCard>
    </form>
  );
}
