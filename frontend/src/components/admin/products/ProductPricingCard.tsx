"use client";

import { useSettings } from "@/app/SettingsContext"; // Import hook settings
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
  CInputGroup,
  CInputGroupText,
  CFormSelect,
} from "@coreui/react";
import React, { useEffect, useState } from "react";

interface ProductPricingCardProps {
  // Nhận vào giá trị gốc (luôn là VND) và hàm cập nhật nó
  priceVND: number | string;
  setPriceVND: (value: number) => void;
  salePriceVND: number | string;
  setSalePriceVND: (value: number) => void;
  // Các props khác giữ nguyên
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
  priceVND,
  setPriceVND,
  salePriceVND,
  setSalePriceVND,
  saleStartDate,
  setSaleStartDate,
  saleEndDate,
  setSaleEndDate,
  sku,
  setSku,
  onGenerateSKU,
  error,
}) => {
  // Lấy tỷ giá từ context
  const settingsContext = useSettings();
  const usdToVndRate = settingsContext.rates?.inverseRates?.USD || 25400; // Tỷ giá 1 USD = ? VND

  // --- STATE MỚI ---
  const [inputCurrency, setInputCurrency] = useState<"VND" | "USD">("VND");
  // State để lưu giá trị hiển thị trên các ô input
  const [displayValues, setDisplayValues] = useState({
    priceVND: String(priceVND),
    priceUSD: (Number(priceVND) / usdToVndRate).toFixed(2),
    salePriceVND: String(salePriceVND),
    salePriceUSD: (Number(salePriceVND) / usdToVndRate).toFixed(2),
  });

  // useEffect để đồng bộ khi prop từ cha thay đổi
  useEffect(() => {
    const newPriceVND = Number(priceVND) || 0;
    const newSalePriceVND = Number(salePriceVND) || 0;
    setDisplayValues({
      priceVND: String(newPriceVND),
      priceUSD: (newPriceVND / usdToVndRate).toFixed(2),
      salePriceVND: String(newSalePriceVND),
      salePriceUSD: (newSalePriceVND / usdToVndRate).toFixed(2),
    });
  }, [priceVND, salePriceVND, usdToVndRate]);

  // Handler khi giá trị trên ô input thay đổi
  const handlePriceChange = (
    value: string,
    field: "price" | "salePrice",
    currency: "VND" | "USD",
  ) => {
    // Chỉ cập nhật giá trị của ô đang được gõ
    if (currency === "VND") {
      if (field === "price")
        setDisplayValues((prev) => ({ ...prev, priceVND: value }));
      else setDisplayValues((prev) => ({ ...prev, salePriceVND: value }));
    } else {
      // currency === 'USD'
      if (field === "price")
        setDisplayValues((prev) => ({ ...prev, priceUSD: value }));
      else setDisplayValues((prev) => ({ ...prev, salePriceUSD: value }));
    }
  };

  const handleBlur = (
    field: "price" | "salePrice",
    currency: "VND" | "USD",
  ) => {
    let numericValue = 0;
    if (currency === "VND") {
      numericValue =
        parseFloat(
          field === "price"
            ? displayValues.priceVND
            : displayValues.salePriceVND,
        ) || 0;
    } else {
      numericValue =
        parseFloat(
          field === "price"
            ? displayValues.priceUSD
            : displayValues.salePriceUSD,
        ) || 0;
    }

    let finalPriceVND = 0;
    if (currency === "VND") {
      finalPriceVND = numericValue;
    } else {
      finalPriceVND = Math.round(numericValue * usdToVndRate); // Làm tròn số VND
    }

    // Cập nhật state của component cha (luôn là số nguyên VND)
    if (field === "price") {
      setPriceVND(finalPriceVND);
    } else {
      setSalePriceVND(finalPriceVND);
    }

    // Đồng bộ lại tất cả các ô input hiển thị với giá trị đã được làm tròn
    const finalSalePriceVND =
      field === "salePrice" ? finalPriceVND : Number(salePriceVND) || 0;
    const finalRegularPriceVND =
      field === "price" ? finalPriceVND : Number(priceVND) || 0;

    setDisplayValues({
      priceVND: String(finalRegularPriceVND),
      priceUSD: (finalRegularPriceVND / usdToVndRate).toFixed(2),
      salePriceVND: String(finalSalePriceVND),
      salePriceUSD: (finalSalePriceVND / usdToVndRate).toFixed(2),
    });
  };

  const hasSalePrice = parseFloat(displayValues.salePriceVND) > 0;

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <CIcon icon={cilDollar} />
          <span>Giá & Kho hàng</span>
        </div>
        <div>
          <CFormSelect
            size="sm"
            value={inputCurrency}
            onChange={(e) => setInputCurrency(e.target.value as "VND" | "USD")}
            aria-label="Chọn tiền tệ nhập giá"
            style={{ minWidth: "150px" }}
          >
            <option value="VND">Nhập giá (VND)</option>
            <option value="USD">Nhập giá (USD)</option>
          </CFormSelect>
        </div>
      </CCardHeader>
      <CCardBody>
        {/* --- GIÁ BÁN --- */}
        <div className="mb-3">
          <CFormLabel>
            Giá bán lẻ*
            {inputCurrency === "VND" && (
              <span className="text-primary ms-1">← Đang nhập VND</span>
            )}
            {inputCurrency === "USD" && (
              <span className="text-primary ms-1">← Đang nhập USD</span>
            )}
          </CFormLabel>
          <div className="d-flex gap-2">
            <CInputGroup className="flex-fill">
              <CInputGroupText>₫</CInputGroupText>
              <CFormInput
                id="priceVND"
                type="number"
                value={displayValues.priceVND}
                onChange={(e) =>
                  handlePriceChange(e.target.value, "price", "VND")
                }
                onBlur={() => handleBlur("price", "VND")}
                readOnly={inputCurrency !== "VND"}
                disabled={inputCurrency !== "VND"}
                invalid={!!error}
                style={{
                  backgroundColor:
                    inputCurrency !== "VND" ? "#f8f9fa" : "white",
                }}
              />
            </CInputGroup>
            <CInputGroup className="flex-fill">
              <CInputGroupText>$</CInputGroupText>
              <CFormInput
                id="priceUSD"
                type="number"
                step="0.01"
                value={displayValues.priceUSD}
                onChange={(e) =>
                  handlePriceChange(e.target.value, "price", "USD")
                }
                onBlur={() => handleBlur("price", "USD")}
                readOnly={inputCurrency !== "USD"}
                disabled={inputCurrency !== "USD"}
                style={{
                  backgroundColor:
                    inputCurrency !== "USD" ? "#f8f9fa" : "white",
                }}
              />
            </CInputGroup>
          </div>
          {error && <div className="text-danger small mt-1">{error}</div>}
        </div>

        {/* --- GIÁ KHUYẾN MÃI --- */}
        <div className="mb-3">
          <CFormLabel>
            Giá khuyến mãi
            {inputCurrency === "VND" && (
              <span className="text-primary ms-1">← Đang nhập VND</span>
            )}
            {inputCurrency === "USD" && (
              <span className="text-primary ms-1">← Đang nhập USD</span>
            )}
          </CFormLabel>
          <div className="d-flex gap-2">
            <CInputGroup className="flex-fill">
              <CInputGroupText>₫</CInputGroupText>
              <CFormInput
                id="salePriceVND"
                type="number"
                value={displayValues.salePriceVND}
                onChange={(e) =>
                  handlePriceChange(e.target.value, "salePrice", "VND")
                }
                onBlur={() => handleBlur("price", "VND")}
                readOnly={inputCurrency !== "VND"}
                disabled={inputCurrency !== "VND"}
                style={{
                  backgroundColor:
                    inputCurrency !== "VND" ? "#f8f9fa" : "white",
                }}
              />
            </CInputGroup>
            <CInputGroup className="flex-fill">
              <CInputGroupText>$</CInputGroupText>
              <CFormInput
                id="salePriceUSD"
                type="number"
                step="0.01"
                value={displayValues.salePriceUSD}
                onChange={(e) =>
                  handlePriceChange(e.target.value, "salePrice", "USD")
                }
                onBlur={() => handleBlur("price", "USD")}
                readOnly={inputCurrency !== "USD"}
                disabled={inputCurrency !== "USD"}
                style={{
                  backgroundColor:
                    inputCurrency !== "USD" ? "#f8f9fa" : "white",
                }}
              />
            </CInputGroup>
          </div>
        </div>

        {hasSalePrice && (
          <CRow className="g-3 mb-4">
            <CCol md={6}>
              <CFormLabel htmlFor="saleStartDate">Ngày bắt đầu Sale</CFormLabel>
              <CFormInput
                id="saleStartDate"
                type="date"
                value={saleStartDate}
                onChange={(e) => setSaleStartDate(e.target.value)}
              />
            </CCol>
            <CCol md={6}>
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

        <div className="border-top pt-3">
          <CFormLabel htmlFor="sku">SKU (Mã SP chính)</CFormLabel>
          <div className="d-flex align-items-center gap-2">
            <CFormInput
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Để trống nếu chỉ bán theo biến thể"
              className="flex-grow-1"
            />
            <CButton
              color="secondary"
              variant="outline"
              onClick={onGenerateSKU}
              className="d-flex align-items-center flex-shrink-0"
            >
              <CIcon icon={cilRecycle} className="me-1" size="sm" />
              Tạo
            </CButton>
          </div>
          <div className="text-muted small mt-1">
            Mã định danh sản phẩm duy nhất trong kho.
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
};

export default ProductPricingCard;
