"use client";

import { BannerSlide, I18nField } from "@/types";
import { cilCloudUpload, cilPlus, cilTrash } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CRow,
} from "@coreui/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import LanguageSwitcherTabs from "../../shared/LanguageSwitcherTabs";
import { useTranslations } from "next-intl";

interface BannerManagerProps {
  banners: BannerSlide[];
  onBannersChange: (
    newBanners: BannerSlide[],
    newImageFiles: (File | null)[],
  ) => void;
}

const BannerManager: React.FC<BannerManagerProps> = ({
  banners,
  onBannersChange,
}) => {
  const t = useTranslations("AdminSettings.bannerManager");
  const [editLocale, setEditLocale] = useState<"vi" | "en">("vi");
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);

  // Đồng bộ hóa state nội bộ khi prop `banners` thay đổi từ bên ngoài
  useEffect(() => {
    // Chỉ reset khi độ dài mảng thay đổi (thêm/xóa banner)
    if (banners.length !== imageFiles.length) {
      setImageFiles(new Array(banners.length).fill(null));
      setPreviewUrls(new Array(banners.length).fill(null));
    }
  }, [banners.length, imageFiles.length]);

  // Handler chung để thay đổi các trường text hoặc checkbox
  const handleFieldChange = <K extends keyof BannerSlide>(
    index: number,
    field: K,
    value: BannerSlide[K],
  ) => {
    const newBanners = [...banners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    onBannersChange(newBanners, imageFiles);
  };

  // Handler riêng cho các trường đa ngôn ngữ
  const handleI18nChange = (
    index: number,
    field: keyof Pick<BannerSlide, "title" | "subtitle" | "buttonText">,
    locale: "vi" | "en",
    value: string,
  ) => {
    const newBanners = [...banners];
    const currentBanner = newBanners[index];
    const currentI18nField: I18nField = currentBanner[field] || {
      vi: "",
      en: "",
    };
    const newI18nField: I18nField = { ...currentI18nField, [locale]: value };
    currentBanner[field] = newI18nField;
    onBannersChange(newBanners, imageFiles);
  };

  // Handler khi admin chọn file ảnh mới
  const handleImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cập nhật mảng các file đã chọn
      const newImageFiles = [...imageFiles];
      newImageFiles[index] = file;
      setImageFiles(newImageFiles);

      // Tạo URL tạm thời để xem trước ảnh
      const newPreviewUrls = [...previewUrls];
      // Thu hồi URL cũ để tránh rò rỉ bộ nhớ
      if (newPreviewUrls[index]) {
        URL.revokeObjectURL(newPreviewUrls[index]!);
      }
      newPreviewUrls[index] = URL.createObjectURL(file);
      setPreviewUrls(newPreviewUrls);

      // Gửi cả hai mảng đã cập nhật lên component cha
      onBannersChange(banners, newImageFiles);
    }
  };

  // Thêm một banner mới
  const addBanner = () => {
    const newBanner: BannerSlide = {
      imageUrl:
        "https://res.cloudinary.com/dh7mq8bgc/image/upload/v1749800656/placeholder_w92s12.jpg",
      title: { vi: t("newBanner.title_vi"), en: t("newBanner.title_en") },
      subtitle: {
        vi: t("newBanner.subtitle_vi"),
        en: t("newBanner.subtitle_en"),
      },
      buttonText: {
        vi: t("newBanner.buttonText_vi"),
        en: t("newBanner.buttonText_en"),
      },
      buttonLink: "/products",
      isActive: true,
    };
    onBannersChange([...banners, newBanner], [...imageFiles, null]);
  };

  // Xóa một banner
  const removeBanner = (index: number) => {
    const newBanners = banners.filter((_, i) => i !== index);
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);

    setImageFiles(newImageFiles);
    setPreviewUrls(newPreviewUrls);
    onBannersChange(newBanners, newImageFiles);
  };

  return (
    <div className="space-y-6">
      <LanguageSwitcherTabs
        activeLocale={editLocale}
        onLocaleChange={setEditLocale}
      />

      {banners.map((banner, index) => (
        <div key={index} className="relative space-y-3 rounded-lg border p-4">
          <button
            type="button"
            onClick={() => removeBanner(index)}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            aria-label={t("deleteBanner")}
            title={t("deleteBanner")}
          >
            <CIcon icon={cilTrash} />
          </button>

          <CRow className="g-3">
            <CCol md={12}>
              <CFormLabel>{t("bannerImage")}</CFormLabel>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-48 flex-shrink-0 rounded-md border bg-gray-100">
                  <Image
                    src={
                      previewUrls[index] ||
                      banner.imageUrl ||
                      "/placeholder-image.jpg"
                    }
                    alt={`Preview banner ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 192px"
                    className="object-contain"
                  />
                </div>
                <label
                  htmlFor={`banner-upload-${index}`}
                  className="flex cursor-pointer items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  <CIcon icon={cilCloudUpload} />
                  <span className="ml-2">{t("changeImage")}</span>
                </label>
                <input
                  id={`banner-upload-${index}`}
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp, image/avif"
                  onChange={(e) => handleImageFileChange(e, index)}
                />
              </div>
            </CCol>
            <CCol md={6}>
              <CFormLabel>
                {t("titleLabel", { locale: editLocale.toUpperCase() })}
              </CFormLabel>
              <CFormInput
                value={banner.title[editLocale] || ""}
                onChange={(e) =>
                  handleI18nChange(index, "title", editLocale, e.target.value)
                }
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>
                {t("subtitleLabel", { locale: editLocale.toUpperCase() })}
              </CFormLabel>
              <CFormInput
                value={banner.subtitle[editLocale] || ""}
                onChange={(e) =>
                  handleI18nChange(
                    index,
                    "subtitle",
                    editLocale,
                    e.target.value,
                  )
                }
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>
                {t("buttonTextLabel", { locale: editLocale.toUpperCase() })}
              </CFormLabel>
              <CFormInput
                value={banner.buttonText[editLocale] || ""}
                onChange={(e) =>
                  handleI18nChange(
                    index,
                    "buttonText",
                    editLocale,
                    e.target.value,
                  )
                }
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel>{t("buttonLinkLabel")}</CFormLabel>
              <CFormInput
                value={banner.buttonLink}
                onChange={(e) =>
                  handleFieldChange(index, "buttonLink", e.target.value)
                }
              />
            </CCol>
            <CCol xs={12}>
              <CFormCheck
                label={t("showBanner")}
                checked={banner.isActive}
                onChange={(e) =>
                  handleFieldChange(index, "isActive", e.target.checked)
                }
              />
            </CCol>
          </CRow>
        </div>
      ))}
      <CButton type="button" color="light" onClick={addBanner}>
        <CIcon icon={cilPlus} className="me-2" />
        {t("addBanner")}
      </CButton>
    </div>
  );
};
export default BannerManager;
