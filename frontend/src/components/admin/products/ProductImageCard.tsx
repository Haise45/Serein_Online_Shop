import { cilTrash } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CSpinner,
} from "@coreui/react";
import Image from "next/image";
import React from "react";
import { useTranslations } from "next-intl";

interface ProductImageCardProps {
  images: string[];
  isUploading: boolean;
  onImageUpload: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  error?: string;
}

const ProductImageCard: React.FC<ProductImageCardProps> = ({
  images,
  isUploading,
  onImageUpload,
  onRemoveImage,
  error,
}) => {
  const t = useTranslations("AdminProductForm.productImages");

  return (
    <CCard className="mb-4">
      <CCardHeader>{t("title")}</CCardHeader>
      <CCardBody>
        <CFormInput
          type="file"
          multiple
          accept="image/*"
          className="mb-3"
          disabled={isUploading}
          onChange={(e) =>
            e.target.files && onImageUpload(Array.from(e.target.files))
          }
        />
        {isUploading && (
          <div className="my-2 text-center">
            <CSpinner size="sm" /> <span>{t("uploading")}</span>
          </div>
        )}
        <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
          {images.map((img, i) => (
            <div key={i} className="group relative rounded-lg border p-2">
              <Image
                src={img}
                alt={`product-img-${i}`}
                width={100}
                height={100}
                quality={100}
                className="h-24 w-full rounded object-cover"
              />
              <CButton
                color="danger"
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 hidden rounded-full bg-white !p-1 group-hover:block"
                onClick={() => onRemoveImage(i)}
                title={t("deleteImage")}
              >
                <CIcon icon={cilTrash} />
              </CButton>
              {i === 0 && (
                <div className="bg-opacity-60 absolute bottom-1 left-1 rounded bg-black px-2 py-1 text-xs text-white">
                  {t("coverImage")}
                </div>
              )}
            </div>
          ))}
        </div>
        {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
      </CCardBody>
    </CCard>
  );
};

export default ProductImageCard;
