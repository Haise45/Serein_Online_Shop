import { getLocalizedName } from "@/lib/utils";
import { Attribute, Category } from "@/types";
import { cilFilterX, cilPlus } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CButton, CCol, CFormInput, CFormSelect, CRow } from "@coreui/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import React from "react";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterMinPrice: string;
  setFilterMinPrice: (value: string) => void;
  filterMaxPrice: string;
  setFilterMaxPrice: (value: string) => void;
  filterIsPublished: string;
  setFilterIsPublished: (value: string) => void;
  filterIsActive: string;
  setFilterIsActive: (value: string) => void;
  categories: Category[];
  isLoadingCategories: boolean;
  clearFilters: () => void;
  attributes: Attribute[];
  isLoadingAttributes: boolean;
  selectedAttributeFilters: Record<string, string>;
  onAttributeChange: (attributeLabel: string, value: string) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterMinPrice,
  setFilterMinPrice,
  filterMaxPrice,
  setFilterMaxPrice,
  filterIsPublished,
  setFilterIsPublished,
  filterIsActive,
  setFilterIsActive,
  categories,
  isLoadingCategories,
  clearFilters,
  attributes,
  isLoadingAttributes,
  selectedAttributeFilters,
  onAttributeChange,
}) => {
  const t = useTranslations("AdminProducts.filters");
  const locale = useLocale() as "vi" | "en";

  return (
    <div className="mb-4">
      {/* Main Filters Row */}
      <CRow className="gy-3 gx-3 mb-3">
        {/* Search */}
        <CCol xs={12} md={3}>
          <CFormInput
            type="search"
            size="sm"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-gray-300"
          />
        </CCol>

        {/* Category */}
        <CCol xs={12} md={3}>
          <CFormSelect
            size="sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border-gray-300"
            aria-label={t("allCategories")}
          >
            <option value="">{t("allCategories")}</option>
            {isLoadingCategories ? (
              <option>{t("loading")}</option>
            ) : (
              categories.map((cat) => (
                <option key={cat._id.toString()} value={cat.slug}>
                  {getLocalizedName(cat.name, locale)}
                </option>
              ))
            )}
          </CFormSelect>
        </CCol>

        {/* Price Range */}
        <CCol xs={6} md={2}>
          <CFormInput
            type="number"
            size="sm"
            placeholder={t("priceFrom")}
            value={filterMinPrice}
            onChange={(e) => setFilterMinPrice(e.target.value)}
            className="border-gray-300"
            min="0"
          />
        </CCol>
        <CCol xs={6} md={2}>
          <CFormInput
            type="number"
            size="sm"
            placeholder={t("priceTo")}
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(e.target.value)}
            className="border-gray-300"
            min="0"
          />
        </CCol>

        {/* Add Product Button */}
        <CCol xs={12} md={2} className="d-flex justify-content-md-end">
          <Link href="/admin/products/create" passHref>
            <CButton color="primary" size="sm" className="w-md-auto w-100">
              <CIcon icon={cilPlus} className="me-1" />
              {t("addProduct")}
            </CButton>
          </Link>
        </CCol>
      </CRow>

      {/* Secondary Filters Row */}
      <CRow className="gy-2 gx-3 align-items-center">
        {/* Published Status */}
        <CCol xs={12} sm={6} md={2}>
          <CFormSelect
            size="sm"
            value={filterIsPublished}
            onChange={(e) => setFilterIsPublished(e.target.value)}
            className="border-gray-300"
             aria-label={t("publishedStatus")}
          >
            <option value="">{t("publishedStatus")}</option>
            <option value="true">{t("published")}</option>
            <option value="false">{t("unpublished")}</option>
          </CFormSelect>
        </CCol>

        {/* Active Status */}
        <CCol xs={12} sm={6} md={2}>
          <CFormSelect
            size="sm"
            value={filterIsActive}
            onChange={(e) => setFilterIsActive(e.target.value)}
            className="border-gray-300"
            aria-label={t("activeStatus")}
          >
            <option value="">{t("activeStatus")}</option>
            <option value="true">{t("active")}</option>
            <option value="false">{t("inactive")}</option>
          </CFormSelect>
        </CCol>

        {/* Dynamic Attribute Filters */}
        {isLoadingAttributes ? (
          <CCol xs={12} sm={6} md={2}>
            <CFormInput
              placeholder="Đang tải thuộc tính..."
              disabled
              size="sm"
            />
          </CCol>
        ) : (
          attributes.map((attr) => (
            <CCol key={attr._id} xs={12} sm={6} md={2}>
              <CFormSelect
                size="sm"
                value={selectedAttributeFilters[attr.label] || ""}
                onChange={(e) => onAttributeChange(attr.label, e.target.value)}
                className="border-gray-300"
                aria-label={t("filterByAttributeAriaLabel", { label: attr.label })}
              >
                <option value="">{t("allAttributes", { label: getLocalizedName(attr.label, locale).toLowerCase() })}</option>
                {attr.values.map((val) => (
                  <option
                    key={val._id}
                    value={getLocalizedName(val.value, locale)}
                  >
                    {getLocalizedName(val.value, locale)}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          ))
        )}

        {/* Clear Filters Button */}
        <CCol xs={12} sm="auto" className="ms-auto">
          <CButton
            color="secondary"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            title={t("clearFiltersTitle")}
            className="px-3"
          >
            <CIcon icon={cilFilterX} className="me-1" />
            {t("clearFilters")}
          </CButton>
        </CCol>
      </CRow>
    </div>
  );
};

export default ProductFilters;
