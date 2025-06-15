import { cilDollar, cilRecycle } from "@coreui/icons";
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
} from "@coreui/react";
import React from "react";

interface ProductPricingCardProps {
  price: string;
  setPrice: (value: string) => void;
  salePrice: string;
  setSalePrice: (value: string) => void;
  saleStartDate: string;
  setSaleStartDate: (value: string) => void;
  saleEndDate: string;
  setSaleEndDate: (value: string) => void;
  sku: string;
  setSku: (value: string) => void;
  onGenerateSKU: () => void;
  error?: string;
}

const ProductPricingCard: React.FC<ProductPricingCardProps> = ({
  price,
  setPrice,
  salePrice,
  setSalePrice,
  saleStartDate,
  setSaleStartDate,
  saleEndDate,
  setSaleEndDate,
  sku,
  setSku,
  onGenerateSKU,
  error,
}) => {
  const hasSalePrice = parseFloat(salePrice) > 0;

  return (
    <CCard className="mb-4">
      <CCardHeader className="flex items-center gap-2">
        <CIcon icon={cilDollar} />
        Giá & Kho hàng
      </CCardHeader>
      <CCardBody>
        <CRow className="g-3 mb-3">
          <CCol xs={hasSalePrice ? 6 : 12}>
            <CFormLabel htmlFor="price">Giá bán lẻ*</CFormLabel>
            <CFormInput
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              invalid={!!error}
            />
          </CCol>
          <CCol xs={6}>
            <CFormLabel htmlFor="salePrice">Giá khuyến mãi</CFormLabel>
            <CFormInput
              id="salePrice"
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </CCol>
          {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
        </CRow>

        {hasSalePrice && (
          <CRow className="g-3 mb-4">
            <CCol xs={6}>
              <CFormLabel htmlFor="saleStartDate">Ngày bắt đầu Sale</CFormLabel>
              <CFormInput
                id="saleStartDate"
                type="date"
                value={saleStartDate}
                onChange={(e) => setSaleStartDate(e.target.value)}
              />
            </CCol>
            <CCol xs={6}>
              <CFormLabel htmlFor="saleEndDate">Ngày kết thúc Sale</CFormLabel>
              <CFormInput
                id="saleEndDate"
                type="date"
                value={saleEndDate}
                onChange={(e) => setSaleEndDate(e.target.value)}
              />
            </CCol>
          </CRow>
        )}

        <div className="border-t pt-3">
          <CFormLabel htmlFor="sku">SKU (Mã SP chính)</CFormLabel>
          <div className="flex items-center gap-2">
            <CFormInput
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Để trống nếu chỉ bán theo biến thể"
            />
            <CButton
              color="secondary"
              variant="outline"
              onClick={onGenerateSKU}
              className="flex-shrink-0"
            >
              <CIcon icon={cilRecycle} className="mr-1" /> Tạo
            </CButton>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Mã định danh sản phẩm duy nhất trong kho.
          </p>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default ProductPricingCard;
