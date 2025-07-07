import { useSettings } from "@/app/SettingsContext";
import { formatCurrency, getVariantDisplayName } from "@/lib/utils";
import { Attribute, Product, Variant } from "@/types";
import {
  cilCheckCircle,
  cilExternalLink,
  cilPen,
  cilPencil,
  cilTrash,
  cilXCircle,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CBadge,
  CButton,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from "@coreui/react";
import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";

const LOW_STOCK_THRESHOLD = 10;

interface ProductTableProps {
  products: Product[];
  handleSort: (columnName: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onDeleteClick: (productId: string, productName: string) => void;
  attributes: Attribute[];
  onStockUpdateClick: (product: Product, variant?: Variant) => void;
  viewingVariantsForProduct: Product | null;
  setViewingVariantsForProduct: (product: Product | null) => void;
  queryString: string;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  handleSort,
  sortBy,
  sortOrder,
  onDeleteClick,
  attributes,
  onStockUpdateClick,
  viewingVariantsForProduct,
  setViewingVariantsForProduct,
  queryString,
}) => {
  // *** SỬ DỤNG CONTEXT ĐỂ LẤY THÔNG TIN TIỀN TỆ ***
  const { displayCurrency, rates } = useSettings();

  // Tạo một map để tra cứu tên thuộc tính/giá trị từ ID một cách hiệu quả
  const attributeMap = useMemo(() => {
    const map = new Map<
      string,
      { label: string; values: Map<string, string> }
    >();
    attributes.forEach((attr) => {
      const valueMap = new Map<string, string>();
      attr.values.forEach((val) => {
        valueMap.set(val._id, val.value);
      });
      map.set(attr._id, { label: attr.label, values: valueMap });
    });
    return map;
  }, [attributes]);

  const renderSortIcon = (columnName: string) => {
    if (sortBy !== columnName) return null;
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  return (
    <>
      <CTable
        hover
        responsive={false}
        className="mb-0 table-fixed"
        style={{
          minWidth: "1200px",
          fontSize: "0.875rem",
        }}
      >
        <CTableHead className="bg-light border-bottom">
          <CTableRow>
            <CTableHeaderCell
              style={{ width: "80px" }}
              className="fw-semibold text-center"
            >
              Mã SP
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "80px" }}
              className="fw-semibold text-center"
            >
              Ảnh
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "280px" }}
              onClick={() => handleSort("name")}
              className="fw-semibold user-select-none cursor-pointer hover:bg-gray-100"
            >
              Tên sản phẩm {renderSortIcon("name")}
            </CTableHeaderCell>
            <CTableHeaderCell style={{ width: "80px" }} className="fw-semibold">
              SKU
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "120px" }}
              onClick={() => handleSort("price")}
              className="fw-semibold user-select-none cursor-pointer text-end hover:bg-gray-100"
            >
              Giá {renderSortIcon("price")}
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "80px" }}
              className="fw-semibold text-center"
            >
              Tồn kho
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "200px" }}
              className="fw-semibold"
            >
              Thuộc tính
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "150px" }}
              className="fw-semibold"
            >
              Danh mục
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "90px" }}
              onClick={() => handleSort("isPublished")}
              className="fw-semibold user-select-none cursor-pointer text-center hover:bg-gray-100"
            >
              Công khai {renderSortIcon("isPublished")}
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "90px" }}
              onClick={() => handleSort("isActive")}
              className="fw-semibold user-select-none cursor-pointer text-center hover:bg-gray-100"
            >
              Kích hoạt {renderSortIcon("isActive")}
            </CTableHeaderCell>
            <CTableHeaderCell
              style={{ width: "120px" }}
              className="fw-semibold text-center"
            >
              Hành động
            </CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {products.map((product) => {
            const mainImage = product.images?.[0] || "/placeholder-image.jpg";
            const totalStockFromVariants = product.variants?.reduce(
              (sum, v) => sum + v.stockQuantity,
              0,
            );
            const displayStock =
              product.variants?.length > 0
                ? totalStockFromVariants
                : product.stockQuantity;

            const stockStatus =
              displayStock! <= 0
                ? { color: "danger", text: "Hết hàng" }
                : displayStock! <= LOW_STOCK_THRESHOLD
                  ? { color: "warning", text: "Sắp hết hàng" }
                  : { color: "success", text: "Còn hàng" };

            const editLink = `/admin/products/${product._id}/edit?${queryString}`;

            return (
              <CTableRow key={product._id} className="align-middle">
                <CTableDataCell className="text-center">
                  <CTooltip content={product._id}>
                    <code className="user-select-all rounded bg-gray-100 px-2 py-1 text-xs">
                      #{product._id.slice(-6).toUpperCase()}
                    </code>
                  </CTooltip>
                </CTableDataCell>
                <CTableDataCell className="p-2 text-center">
                  <div className="d-inline-block">
                    <Image
                      src={mainImage}
                      alt={product.name}
                      width={45}
                      height={45}
                      quality={100}
                      className="rounded border object-cover object-top"
                      style={{ aspectRatio: "1/1" }}
                    />
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  <div className="d-flex align-items-center">
                    <CTooltip content={product.name}>
                      <Link
                        href={editLink}
                        className="fw-medium text-primary text-decoration-none hover:text-primary-dark me-2"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: "1.3",
                        }}
                      >
                        {product.name}
                      </Link>
                    </CTooltip>
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-primary flex-shrink-0"
                      title="Xem trên shop"
                    >
                      <CIcon icon={cilExternalLink} size="sm" />
                    </Link>
                  </div>
                </CTableDataCell>
                <CTableDataCell
                  style={{
                    width: "80px",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                >
                  <CTooltip content={product.sku || "Không có SKU"}>
                    <span className="text-muted block text-sm break-words">
                      {product.sku || "N/A"}
                    </span>
                  </CTooltip>
                </CTableDataCell>

                <CTableDataCell className="text-end">
                  <span className="fw-semibold text-gray-800">
                    {formatCurrency(product.displayPrice, { currency: displayCurrency, rates })}
                  </span>
                  {product.isOnSale && (
                    <CTooltip
                      content={`Giá gốc: ${formatCurrency(product.price, { currency: displayCurrency, rates })}`}
                    >
                      <div className="text-xs text-gray-500 line-through">
                        {formatCurrency(product.price, { currency: displayCurrency, rates })}
                      </div>
                    </CTooltip>
                  )}
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  <CTooltip content={stockStatus.text}>
                    <div className="flex items-center justify-center">
                      <span
                        className={classNames(
                          "fw-semibold",
                          `text-${stockStatus.color}`,
                        )}
                      >
                        {displayStock}
                      </span>
                      {(!product.variants || product.variants.length === 0) && (
                        <CButton
                          size="sm"
                          color="light"
                          className="ml-2 !p-1"
                          onClick={() => onStockUpdateClick(product)}
                        >
                          <CIcon icon={cilPencil} size="sm" />
                        </CButton>
                      )}
                    </div>
                  </CTooltip>
                </CTableDataCell>
                <CTableDataCell>
                  {product.variants?.length > 0 ? (
                    <div className="text-sm">
                      {product.variants.slice(0, 2).map((v) => {
                        const variantDisplayName = getVariantDisplayName(
                          v.optionValues,
                          attributeMap,
                        );
                        return (
                          <CTooltip
                            key={v._id}
                            content={`${variantDisplayName} | Kho: ${v.stockQuantity} | SKU: ${v.sku}`}
                          >
                            <div
                              className="bg-light text-truncate mb-1 flex items-center justify-between rounded p-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              <span className="text-dark">
                                {variantDisplayName}
                              </span>
                              <div className="ml-2 flex flex-shrink-0 items-center">
                                <span className="text-muted">
                                  ({v.stockQuantity})
                                </span>
                                <CButton
                                  size="sm"
                                  color="light"
                                  className="ml-1 !p-1"
                                  title={`Cập nhật tồn kho cho ${variantDisplayName}`}
                                  onClick={() => onStockUpdateClick(product, v)}
                                >
                                  <CIcon icon={cilPencil} size="sm" />
                                </CButton>
                              </div>
                            </div>
                          </CTooltip>
                        );
                      })}
                      {product.variants.length > 2 && (
                        <CButton
                          color="secondary"
                          variant="ghost"
                          size="sm"
                          className="mt-1 !p-1 !text-xs !font-medium"
                          onClick={() => setViewingVariantsForProduct(product)}
                        >
                          +{product.variants.length - 2} biến thể khác...
                        </CButton>
                      )}
                    </div>
                  ) : (
                    <CBadge
                      color="light"
                      className="text-muted"
                      style={{ fontSize: "0.7rem" }}
                    >
                      Không có
                    </CBadge>
                  )}
                </CTableDataCell>
                <CTableDataCell>
                  <CTooltip
                    content={
                      typeof product.category === "object"
                        ? product.category.name
                        : "N/A"
                    }
                  >
                    <span className="truncate text-sm">
                      {typeof product.category === "object"
                        ? product.category.name
                        : "N/A"}
                    </span>
                  </CTooltip>
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  <CTooltip
                    content={
                      product.isPublished ? "Đã công khai" : "Chưa công khai"
                    }
                  >
                    <div>
                      {product.isPublished ? (
                        <CIcon
                          icon={cilCheckCircle}
                          className="text-success"
                          size="lg"
                        />
                      ) : (
                        <CIcon
                          icon={cilXCircle}
                          className="text-danger"
                          size="lg"
                        />
                      )}
                    </div>
                  </CTooltip>
                </CTableDataCell>

                <CTableDataCell className="text-center">
                  <CTooltip
                    content={
                      product.isActive ? "Đang kích hoạt" : "Ngừng kích hoạt"
                    }
                  >
                    <div>
                      {product.isActive ? (
                        <CIcon
                          icon={cilCheckCircle}
                          className="text-success"
                          size="lg"
                        />
                      ) : (
                        <CIcon
                          icon={cilXCircle}
                          className="text-muted"
                          size="lg"
                        />
                      )}
                    </div>
                  </CTooltip>
                </CTableDataCell>

                <CTableDataCell className="text-center">
                  <div className="d-flex justify-content-center gap-1">
                    <CTooltip content="Xem chi tiết và chỉnh sửa thông tin">
                      <Link href={editLink} passHref>
                        <CButton
                          color="info"
                          variant="outline"
                          size="sm"
                          className="p-2"
                        >
                          <CIcon icon={cilPen} size="sm" />
                        </CButton>
                      </Link>
                    </CTooltip>

                    <CTooltip content="Ẩn sản phẩm">
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        className="p-2"
                        onClick={() => onDeleteClick(product._id, product.name)}
                      >
                        <CIcon icon={cilTrash} size="sm" />
                      </CButton>
                    </CTooltip>
                  </div>
                </CTableDataCell>
              </CTableRow>
            );
          })}
        </CTableBody>
      </CTable>

      <CModal
        visible={!!viewingVariantsForProduct}
        onClose={() => setViewingVariantsForProduct(null)}
        size="lg"
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            Tất cả biến thể: {viewingVariantsForProduct?.name}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Phiên bản</CTableHeaderCell>
                <CTableHeaderCell>SKU</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Giá</CTableHeaderCell>
                <CTableHeaderCell className="text-center">
                  Tồn kho
                </CTableHeaderCell>
                <CTableHeaderCell className="text-center">
                  Hành động
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {viewingVariantsForProduct?.variants.map((variant) => {
                const displayName = getVariantDisplayName(
                  variant.optionValues,
                  attributeMap,
                );
                const variantStockStatus =
                  variant.stockQuantity <= 0
                    ? "Hết"
                    : variant.stockQuantity <= LOW_STOCK_THRESHOLD
                      ? "Sắp hết"
                      : "Còn";
                return (
                  <CTableRow key={variant._id} className="align-middle">
                    <CTableDataCell className="font-medium">
                      {displayName}
                    </CTableDataCell>
                    <CTableDataCell>
                      <code>{variant.sku}</code>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      <div className="fw-semibold text-gray-800">
                        {formatCurrency(variant.salePrice, { currency: displayCurrency, rates })}
                      </div>
                      {viewingVariantsForProduct?.isOnSale && (
                        <div className="text-xs text-gray-400 line-through">
                          {formatCurrency(variant.price, { currency: displayCurrency, rates })}
                        </div>
                      )}
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CTooltip content={variantStockStatus}>
                        <span
                          className={classNames("fw-semibold", {
                            "text-danger": variant.stockQuantity <= 0,
                            "text-warning":
                              variant.stockQuantity > 0 &&
                              variant.stockQuantity <= LOW_STOCK_THRESHOLD,
                          })}
                        >
                          {variant.stockQuantity}
                        </span>
                      </CTooltip>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CTooltip content="Cập nhật tồn kho">
                        <CButton
                          size="sm"
                          color="info"
                          variant="outline"
                          className="!p-1"
                          onClick={() => {
                            setViewingVariantsForProduct(null);
                            setTimeout(() => {
                              onStockUpdateClick(
                                viewingVariantsForProduct!,
                                variant,
                              );
                            }, 150);
                          }}
                        >
                          <CIcon icon={cilPencil} size="sm" />
                        </CButton>
                      </CTooltip>
                    </CTableDataCell>
                  </CTableRow>
                );
              })}
            </CTableBody>
          </CTable>
        </CModalBody>
      </CModal>
    </>
  );
};

export default ProductTable;
