"use client";

import "@/app/globals.css";
import { useSettings } from "@/app/SettingsContext";
import DataTablePagination from "@/components/admin/layout/DataTablePagination";
import ProductFilters from "@/components/admin/products/ProductFilters";
import ProductTable from "@/components/admin/products/ProductTable";
import StockUpdateModal from "@/components/admin/products/StockUpdateModal";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import useDebounce from "@/hooks/useDebounce";
import { useGrabToScroll } from "@/hooks/useGrabToScroll";
import { useGetAttributes } from "@/lib/react-query/attributeQueries";
import { useGetAllCategories } from "@/lib/react-query/categoryQueries";
import {
  useDeleteAdminProduct,
  useGetProducts,
  useUpdateProductStock,
  useUpdateVariantStock,
} from "@/lib/react-query/productQueries";
import { getLocalizedName, getVariantDisplayName } from "@/lib/utils";
import {
  GetProductsParams,
  PaginatedProductsResponse,
} from "@/services/productService";
import { Product, Variant } from "@/types";
import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from "@coreui/react";
import { useTranslations, useLocale } from "next-intl";
import {
  useSearchParams as useNextSearchParamsHook,
  useSearchParams,
} from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminProductsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const currentNextSearchParams = useNextSearchParamsHook();
  const scrollableContainerRef = useGrabToScroll<HTMLDivElement>();
  const currentSearchParams = useSearchParams();
  const { settings } = useSettings();
  const defaultLimitFromSettings =
    settings?.adminTable?.defaultItemsPerPage || 10;
  const t = useTranslations("AdminProducts");
  const tAdmin = useTranslations("Admin");
  const tShared = useTranslations("Shared.confirmModal");
  const locale = useLocale() as "vi" | "en";
  // --- States ---
  const [currentPage, setCurrentPage] = useState<number>(
    Number(currentNextSearchParams.get("page")) || 1,
  );
  const [limit, setLimit] = useState<number>(
    Number(currentNextSearchParams.get("limit")) || defaultLimitFromSettings,
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    currentNextSearchParams.get("search") || "",
  );
  const [sortBy, setSortBy] = useState<string>(
    currentNextSearchParams.get("sortBy") || "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (currentNextSearchParams.get("sortOrder") as "asc" | "desc") || "desc",
  );
  const [filterCategory, setFilterCategory] = useState<string>(
    currentNextSearchParams.get("category") || "",
  );
  const [filterIsPublished, setFilterIsPublished] = useState<string>(
    currentNextSearchParams.get("isPublished") || "",
  );
  const [filterIsActive, setFilterIsActive] = useState<string>(
    currentNextSearchParams.get("isActive") || "",
  );
  const [filterMinPrice, setFilterMinPrice] = useState<string>(
    currentNextSearchParams.get("minPrice") || "",
  );
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>(
    currentNextSearchParams.get("maxPrice") || "",
  );
  const [viewingVariantsForProduct, setViewingVariantsForProduct] =
    useState<Product | null>(null);
  // Cấu trúc: { 'Màu sắc': 'Đỏ,Xanh', 'Size': 'S' }
  const [filterAttributes, setFilterAttributes] = useState<
    Record<string, string>
  >({});

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedMinPrice = useDebounce(filterMinPrice, 500);
  const debouncedMaxPrice = useDebounce(filterMaxPrice, 500);
  const currentQueryString = currentSearchParams.toString();

  // State để quản lý modal
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    productToDelete: { id: string; name: string } | null;
  }>({
    isOpen: false,
    productToDelete: null,
  });

  // State để quản lý modal tồn kho
  const [stockModal, setStockModal] = useState<{
    visible: boolean;
    product: Product | null;
    variant?: Variant | null;
    returnToList?: boolean;
  }>({ visible: false, product: null, variant: null, returnToList: false });

  const deleteProductMutation = useDeleteAdminProduct();
  const updateProductStockMutation = useUpdateProductStock();
  const updateVariantStockMutation = useUpdateVariantStock();

  // --- Data Fetching ---
  const { data: categoriesPaginatedData, isLoading: isLoadingCategories } =
    useGetAllCategories({
      isActive: true,
      limit: 200,
    });
  const categoriesForFilter = categoriesPaginatedData?.categories || [];

  const { data: attributesForFilter, isLoading: isLoadingAttributes } =
    useGetAttributes();

  // Tạo attributeMap ở component cha để có thể truyền vào hàm helper
  const attributeMap = useMemo(() => {
    if (!attributesForFilter) return new Map();
    const map = new Map<
      string,
      { label: string; values: Map<string, string> }
    >();
    attributesForFilter.forEach((attr) => {
      const valueMap = new Map<string, string>();
      attr.values.forEach((val) => {
        valueMap.set(val._id, getLocalizedName(val.value, locale));
      });
      map.set(attr._id, {
        label: getLocalizedName(attr.label, locale),
        values: valueMap,
      });
    });
    return map;
  }, [attributesForFilter, locale]);

  const queryParams: GetProductsParams = useMemo(
    () => ({
      page: currentPage,
      limit: limit,
      search: debouncedSearchTerm || undefined,
      sortBy,
      sortOrder,
      category: filterCategory || undefined,
      isActive: filterIsActive === "" ? undefined : filterIsActive === "true",
      isPublished:
        filterIsPublished === "" ? undefined : filterIsPublished === "true",
      minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
      maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
      attributes: filterAttributes,
    }),
    [
      currentPage,
      limit,
      debouncedSearchTerm,
      sortBy,
      sortOrder,
      filterCategory,
      filterIsActive,
      filterIsPublished,
      debouncedMinPrice,
      debouncedMaxPrice,
      filterAttributes,
    ],
  );

  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetProducts(queryParams, {
    placeholderData: (previousData: PaginatedProductsResponse | undefined) =>
      previousData,
  }) as {
    data: PaginatedProductsResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
  };

  // --- URL Sync ---
  useEffect(() => {
    const params = new URLSearchParams(currentNextSearchParams);
    const updateParam = (
      key: string,
      value: string,
      defaultValue?: unknown,
    ) => {
      if (value && value !== defaultValue) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };
    updateParam("page", currentPage > 1 ? String(currentPage) : "");
    updateParam(
      "limit",
      limit !== defaultLimitFromSettings ? String(limit) : "",
    );
    updateParam("search", debouncedSearchTerm);
    updateParam("sortBy", sortBy, "createdAt");
    updateParam("sortOrder", sortOrder, "desc");
    updateParam("category", filterCategory);
    updateParam("isPublished", filterIsPublished);
    updateParam("isActive", filterIsActive);
    updateParam("minPrice", debouncedMinPrice);
    updateParam("maxPrice", debouncedMaxPrice);
    updateParam("attributes", JSON.stringify(filterAttributes));

    if (params.toString() !== currentNextSearchParams.toString()) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [
    currentPage,
    limit,
    debouncedSearchTerm,
    sortBy,
    sortOrder,
    filterCategory,
    filterIsPublished,
    filterIsActive,
    debouncedMinPrice,
    debouncedMaxPrice,
    filterAttributes,
    pathname,
    router,
    currentNextSearchParams,
    defaultLimitFromSettings,
  ]);

  // --- Handlers ---
  const handleOpenDeleteModal = (id: string, name: string) => {
    setModalState({ isOpen: true, productToDelete: { id, name } });
  };

  const handleCloseDeleteModal = () => {
    setModalState({ isOpen: false, productToDelete: null });
  };

  const handleConfirmDelete = () => {
    if (modalState.productToDelete) {
      deleteProductMutation.mutate(modalState.productToDelete.id, {
        onSuccess: () => {
          handleCloseDeleteModal();
        },
      });
    }
  };

  const handleOpenStockModal = (
    product: Product,
    variant?: Variant,
    returnToList: boolean = false,
  ) => {
    setStockModal({ visible: true, product, variant, returnToList });
  };

  const handleCloseStockModal = () => {
    setStockModal({
      visible: false,
      product: null,
      variant: null,
    });
  };

  const handleSaveStock = (update: { change?: number; set?: number }) => {
    const { product, variant } = stockModal;
    if (!product) return;

    // Logic để mở lại modal danh sách sau khi thành công
    const onSuccessCallback = () => {
      handleCloseStockModal();
    };

    if (variant) {
      // Cập nhật tồn kho cho biến thể
      updateVariantStockMutation.mutate(
        { productId: product._id, variantId: variant._id, update },
        { onSuccess: onSuccessCallback },
      );
    } else {
      // Cập nhật tồn kho cho sản phẩm chính
      updateProductStockMutation.mutate(
        { productId: product._id, update },
        { onSuccess: onSuccessCallback },
      );
    }
  };

  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy);
    setSortOrder((prev) =>
      sortBy === newSortBy && prev === "asc" ? "desc" : "asc",
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setFilterIsActive("");
    setFilterIsPublished("");
    setFilterMinPrice("");
    setFilterMaxPrice("");
    setFilterAttributes({});
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(
    debouncedSearchTerm ||
    filterCategory ||
    filterIsActive ||
    filterIsPublished ||
    debouncedMinPrice ||
    debouncedMaxPrice
  );

  const handleAttributeFilterChange = (
    attributeLabel: string,
    value: string,
  ) => {
    setFilterAttributes((prev) => {
      const newFilters = { ...prev };
      if (value) {
        newFilters[attributeLabel] = value;
      } else {
        delete newFilters[attributeLabel];
      }
      return newFilters;
    });
    // Reset về trang 1 khi lọc
    setCurrentPage(1);
  };

  const products: Product[] = paginatedData?.products || [];
  const totalPages = paginatedData?.totalPages || 1;

  if (isError) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>{t("list.errorTitle")}</CCardHeader>
            <CCardBody className="p-5 text-center">
              <CIcon icon={cilWarning} size="xl" className="text-danger mb-3" />
              <p className="text-danger">{t("list.errorMessage")}</p>
              <p className="text-muted text-sm">{error?.message}</p>
              <CButton
                color="primary"
                onClick={() => refetch()}
                className="mt-3"
              >
                {t("list.retryButton")}
              </CButton>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm">
          <CCardHeader className="border-b bg-white !p-4">
            <div className="d-flex align-items-center mb-3">
              <h4 className="fw-semibold text-dark mb-0">{t("list.title")}</h4>
              {hasActiveFilters && (
                <CBadge color="info" className="ms-2 px-2 py-1">
                  {t("list.results", {
                    count: paginatedData?.totalProducts || 0,
                  })}
                </CBadge>
              )}
            </div>
            <ProductFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterCategory={filterCategory}
              setFilterCategory={(value) => {
                setFilterCategory(value);
                setCurrentPage(1);
              }}
              filterMinPrice={filterMinPrice}
              setFilterMinPrice={(value) => {
                setFilterMinPrice(value);
                setCurrentPage(1);
              }}
              filterMaxPrice={filterMaxPrice}
              setFilterMaxPrice={(value) => {
                setFilterMaxPrice(value);
                setCurrentPage(1);
              }}
              filterIsPublished={filterIsPublished}
              setFilterIsPublished={(value) => {
                setFilterIsPublished(value);
                setCurrentPage(1);
              }}
              filterIsActive={filterIsActive}
              setFilterIsActive={(value) => {
                setFilterIsActive(value);
                setCurrentPage(1);
              }}
              categories={categoriesForFilter}
              isLoadingCategories={isLoadingCategories}
              clearFilters={clearFilters}
              attributes={attributesForFilter || []}
              isLoadingAttributes={isLoadingAttributes}
              selectedAttributeFilters={filterAttributes}
              onAttributeChange={handleAttributeFilterChange}
            />
          </CCardHeader>

          <CCardBody
            ref={scrollableContainerRef}
            className="position-relative grabbable p-0"
            style={{ overflow: "auto" }}
          >
            {isLoading && !products.length ? (
              <div className="p-5 text-center">
                <CSpinner color="primary" />
                <div className="text-muted mt-2">{t("list.loading")}</div>
              </div>
            ) : products.length === 0 ? (
              <div className="p-5 text-center">
                <div className="text-muted mb-2">
                  <CIcon
                    icon={cilWarning}
                    size="xl"
                    className="text-secondary"
                  />
                </div>
                <p className="text-muted mb-0">
                  {hasActiveFilters
                    ? t("list.noResultsWithFilter")
                    : t("list.noProductsYet")}
                </p>
              </div>
            ) : (
              <>
                <ProductTable
                  products={products}
                  handleSort={handleSort}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onDeleteClick={handleOpenDeleteModal}
                  onStockUpdateClick={handleOpenStockModal}
                  setViewingVariantsForProduct={setViewingVariantsForProduct}
                  viewingVariantsForProduct={viewingVariantsForProduct}
                  attributes={attributesForFilter || []}
                  queryString={currentQueryString}
                />
                {isLoading && (
                  <div className="position-absolute d-flex align-items-center justify-content-center bg-opacity-75 start-0 top-0 z-3 h-100 w-100 bg-white">
                    <CSpinner color="primary" className="me-2" />
                    <span className="text-muted">{t("list.loading")}</span>
                  </div>
                )}
              </>
            )}
          </CCardBody>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={paginatedData?.totalProducts || 0}
            limit={limit}
            onPageChange={setCurrentPage}
            onLimitChange={handleLimitChange}
            itemType={tAdmin("breadcrumbs.products", {
              count: 2,
            }).toLowerCase()}
            defaultLimitFromSettings={defaultLimitFromSettings}
          />
        </CCard>
      </CCol>
      {/* Render component modal */}
      <ConfirmationModal
        visible={modalState.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title={t("deleteModal.title")}
        body={
          <>
            <p>
              {t.rich("deleteModal.body", {
                name: modalState.productToDelete?.name ?? "",
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>
            <br />
            <small className="text-muted">{t("deleteModal.note")}</small>
          </>
        }
        confirmButtonText={tShared("confirm")}
        cancelButtonText={tShared("cancel")}
        confirmButtonColor="danger"
        isConfirming={deleteProductMutation.isPending}
      />

      {stockModal.visible && stockModal.product && (
        <StockUpdateModal
          visible={stockModal.visible}
          onClose={handleCloseStockModal}
          onSave={handleSaveStock}
          isSaving={
            updateProductStockMutation.isPending ||
            updateVariantStockMutation.isPending
          }
          itemName={
            stockModal.variant
              ? // Dùng hàm helper với attributeMap đã được dịch
                `${getLocalizedName(stockModal.product.name, locale)} (${getVariantDisplayName(
                  stockModal.variant.optionValues,
                  attributeMap, // Sử dụng map đã dịch
                )})`
              : // Nếu không có variant, dịch tên sản phẩm
                getLocalizedName(stockModal.product.name, locale)
          }
          currentStock={
            stockModal.variant
              ? stockModal.variant.stockQuantity
              : stockModal.product.stockQuantity
          }
        />
      )}
    </CRow>
  );
}
