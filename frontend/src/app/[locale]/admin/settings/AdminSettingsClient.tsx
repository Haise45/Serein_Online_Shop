"use client";

import { useSettings } from "@/app/SettingsContext";
import BannerManager from "@/components/admin/settings/BannerManager";
import { useUpdateSettings } from "@/lib/react-query/settingQueries";
import { useUploadImages } from "@/lib/react-query/uploadQueries";
import { BannerSlide, Setting } from "@/types";
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
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function AdminSettingsClient() {
  const t = useTranslations("AdminSettings");
  const { settings: initialSettings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const uploadImagesMutation = useUploadImages();

  const [formData, setFormData] = useState<Partial<Setting>>({});
  const [bannerImageFiles, setBannerImageFiles] = useState<(File | null)[]>([]);

  useEffect(() => {
    if (initialSettings) {
      setFormData(initialSettings);
      // Khởi tạo mảng file ảnh với độ dài tương ứng
      setBannerImageFiles(
        new Array(initialSettings.landingPage?.banners?.length || 0).fill(null),
      );
    }
  }, [initialSettings]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [section, key] = name.split(".");
      if (section in formData) {
        setFormData((prev) => ({
          ...prev,
          [section]: {
            ...(prev[section as keyof typeof prev] as object),
            [key]: key.startsWith("default")
              ? value
              : value === ""
                ? 0
                : Number(value),
          },
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBannersChange = (
    newBanners: BannerSlide[],
    newImageFiles: (File | null)[],
  ) => {
    setFormData((prev) => {
      const currentLandingPage = prev.landingPage || {
        maxFeaturedProducts: 8,
        maxNewestProducts: 8,
        banners: [],
      };
      return {
        ...prev,
        landingPage: {
          ...currentLandingPage,
          banners: newBanners,
        },
      };
    });
    setBannerImageFiles(newImageFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Tạo một bản sao của mảng banners để có thể thay đổi an toàn
    const finalBanners = JSON.parse(
      JSON.stringify(formData.landingPage?.banners || []),
    );

    // 1. Xác định các file cần upload
    const filesToUpload = bannerImageFiles
      .map((file, index) => ({ file, index }))
      .filter(
        (item): item is { file: File; index: number } => item.file !== null,
      );

    // 2. Nếu có file mới, upload chúng trước
    if (filesToUpload.length > 0) {
      // 2.1. Chuẩn bị payload đúng cho hook useUploadImages
      const uploadPayload = {
        // Lấy ra mảng các object File
        files: filesToUpload.map((item) => item.file),
        // Chỉ định thư mục upload trên Cloudinary
        area: "settings/banners",
      };

      try {
        toast.loading(t("uploadingImages"), { id: "uploading-images" });

        // 2.2. Gọi mutation với payload đã đúng type
        const uploadedData =
          await uploadImagesMutation.mutateAsync(uploadPayload);
        const uploadedUrls = uploadedData.imageUrls;

        toast.dismiss("uploading-images");

        // 3. Cập nhật lại URL trong mảng finalBanners
        filesToUpload.forEach((item, i) => {
          if (finalBanners[item.index] && uploadedUrls[i]) {
            finalBanners[item.index].imageUrl = uploadedUrls[i];
          }
        });
      } catch {
        toast.dismiss("uploading-images");
        // Không cần toast error ở đây vì hook đã tự xử lý
        return; // Dừng lại nếu upload lỗi
      }
    }

    // 4. Tạo payload cuối cùng để lưu vào DB
    const payload: Partial<Setting> = {
      ...formData,
      landingPage: {
        ...(formData.landingPage as object),
        maxFeaturedProducts: formData.landingPage?.maxFeaturedProducts ?? 8,
        maxNewestProducts: formData.landingPage?.maxNewestProducts ?? 8,
        banners: finalBanners,
      },
    };

    updateSettingsMutation.mutate(payload);
  };

  const isSubmitting =
    updateSettingsMutation.isPending || uploadImagesMutation.isPending;

  // Hiển thị màn hình loading nếu chưa có dữ liệu cài đặt ban đầu
  if (isLoading || !initialSettings || Object.keys(formData).length === 0) {
    return (
      <div className="p-10 text-center">
        <CSpinner />
        <p className="text-muted mt-2">{t("loading")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <CCard className="shadow-sm">
        <CCardHeader>
          <h5 className="mb-0 font-semibold">{t("systemConfig")}</h5>
        </CCardHeader>
        <CCardBody className="space-y-8 p-4 md:p-6">
          {/* --- CÀI ĐẶT CHUNG (CLIENT) --- */}
          <section>
            <h6 className="mb-4 border-b pb-2 text-lg font-bold text-gray-700">
              {t("clientSettings.title")}
            </h6>
            <CRow>
              <CCol md={6}>
                <CFormLabel htmlFor="clientDefaultLanguage">
                  {t("clientSettings.defaultLanguage")}
                </CFormLabel>
                <CFormSelect
                  id="clientDefaultLanguage"
                  name="clientSettings.defaultLanguage"
                  value={formData.clientSettings?.defaultLanguage}
                  onChange={handleInputChange}
                >
                  <option value="vi">{t("languages.vi")}</option>
                  <option value="en">{t("languages.en")}</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="clientDefaultCurrency">
                  {t("clientSettings.defaultCurrency")}
                </CFormLabel>
                <CFormSelect
                  id="clientDefaultCurrency"
                  name="clientSettings.defaultCurrency"
                  value={formData.clientSettings?.defaultCurrency}
                  onChange={handleInputChange}
                >
                  <option value="VND">{t("currencies.VND")}</option>
                  <option value="USD">{t("currencies.USD")}</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </section>

          {/* --- CÀI ĐẶT CHUNG (ADMIN) --- */}
          <section>
            <h6 className="mb-4 border-b pb-2 text-lg font-bold text-gray-700">
              {t("adminSettings.title")}
            </h6>
            <CRow>
              <CCol md={6}>
                <CFormLabel htmlFor="adminDefaultLanguage">
                  {t("adminSettings.defaultLanguage")}
                </CFormLabel>
                <CFormSelect
                  id="adminDefaultLanguage"
                  name="adminSettings.defaultLanguage"
                  value={formData.adminSettings?.defaultLanguage}
                  onChange={handleInputChange}
                >
                  <option value="vi">{t("languages.vi")}</option>
                  <option value="en">{t("languages.en")}</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="adminDefaultCurrency">
                  {t("adminSettings.defaultCurrency")}
                </CFormLabel>
                <CFormSelect
                  id="adminDefaultCurrency"
                  name="adminSettings.defaultCurrency"
                  value={formData.adminSettings?.defaultCurrency}
                  onChange={handleInputChange}
                >
                  <option value="VND">{t("currencies.VND")}</option>
                  <option value="USD">{t("currencies.USD")}</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </section>

          {/* --- CÀI ĐẶT GIAO DIỆN CLIENT --- */}
          <section>
            <h6 className="mb-4 border-b pb-2 text-lg font-bold text-gray-700">
              {t("homepageUI.title")}
            </h6>
            <div className="mb-6">
              <h5 className="mb-3 font-medium">
                {t("homepageUI.bannerManager")}
              </h5>
              <BannerManager
                banners={formData.landingPage?.banners || []}
                onBannersChange={handleBannersChange}
              />
            </div>
            <CRow className="g-4">
              <CCol md={6} lg={4}>
                <CFormLabel htmlFor="maxFeaturedProducts">
                  {t("homepageUI.featuredProducts")}
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
                  {t("homepageUI.newestProducts")}
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
                  {t("homepageUI.productsPerPage")}
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
              {t("adminUI.title")}
            </h6>
            <CRow className="g-4">
              <CCol md={6} lg={4}>
                <CFormLabel htmlFor="defaultItemsPerPage">
                  {t("adminUI.rowsPerPage")}
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
          <CButton type="submit" color="primary" disabled={isSubmitting}>
            {isSubmitting ? t("processing") : t("saveChanges")}
          </CButton>
        </CCardFooter>
      </CCard>
    </form>
  );
}
