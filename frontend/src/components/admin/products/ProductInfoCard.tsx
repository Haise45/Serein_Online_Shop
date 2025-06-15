import {
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormLabel,
  CSpinner,
} from "@coreui/react";
import dynamic from "next/dynamic";
import React from "react";

// Tải động CustomEditor và định nghĩa component Loading ngay tại đây
const CustomEditor = dynamic(() => import("@/components/shared/CustomEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[342px] items-center justify-center rounded-lg border bg-gray-50">
      <CSpinner size="sm" />
      <span className="ml-2 text-gray-400">Đang tải trình soạn thảo...</span>
    </div>
  ),
});

interface ProductInfoCardProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  error?: string;
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({
  name,
  setName,
  description,
  setDescription,
  error,
}) => {
  return (
    <CCard className="mb-4 shadow-sm">
      <CCardHeader className="!p-4">
        <h5 className="mb-1 font-semibold">Thông tin sản phẩm</h5>
        <p className="mb-0 text-sm text-gray-500">
          Tên và mô tả sẽ được hiển thị cho khách hàng trên trang chi tiết.
        </p>
      </CCardHeader>
      <CCardBody className="!p-4">
        <div className="mb-4">
          <CFormLabel htmlFor="name" className="font-medium">
            Tên sản phẩm*
          </CFormLabel>
          <CFormInput
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={!!error}
            placeholder="Ví dụ: Áo Polo Thể Thao Vải Pique"
            className="mt-1"
          />
          {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </div>

        <div>
          <CFormLabel htmlFor="description" className="font-medium">
            Mô tả chi tiết
          </CFormLabel>
          <div className="mt-1">
            <CustomEditor
              initialData={description}
              onChange={(data) => setDescription(data)}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Mô tả chi tiết giúp khách hàng hiểu rõ hơn về sản phẩm. Bạn có thể
            chèn ảnh, video và định dạng văn bản tại đây.
          </p>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default ProductInfoCard;