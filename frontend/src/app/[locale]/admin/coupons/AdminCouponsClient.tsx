"use client";

import DataTablePagination from "@/components/admin/layout/DataTablePagination";
import CouponFilters from "@/components/admin/coupons/CouponFilters";
import CouponTable from "@/components/admin/coupons/CouponTable";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import useDebounce from "@/hooks/useDebounce";
import {
  useGetAdminCoupons,
  useDeleteCouponAdmin,
  useCreateCoupon,
  useUpdateCoupon,
  useGetAdminCouponById,
} from "@/lib/react-query/couponQueries";
import { GetCouponsParams } from "@/services/couponService";
import { CouponFormData, DiscountType } from "@/types";
import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from "@coreui/react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import CouponForm from "@/components/admin/coupons/CouponForm";
import { useSettings } from "@/app/SettingsContext";
import { useTranslations } from "next-intl";

export default function AdminCouponsClient() {
  const t = useTranslations("AdminCoupons.list");
  const tForm = useTranslations("AdminCoupons.form");
  const tDelete = useTranslations("AdminCoupons.deleteModal");
  const tAdmin = useTranslations("Admin");
  const tShared = useTranslations("Shared.confirmModal");
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { settings, displayCurrency, rates } = useSettings();
  const defaultLimitFromSettings =
    settings?.adminTable?.defaultItemsPerPage || 10;
  // --- States for Filters and Pagination ---
  const [filters, setFilters] = useState({
    code: searchParams.get("code") || "",
    isActive: searchParams.get("isActive") || "",
    discountType: searchParams.get("discountType") || "",
  });
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [limit, setLimit] = useState(
    Number(searchParams.get("limit")) || defaultLimitFromSettings || 10,
  );
  const debouncedCode = useDebounce(filters.code, 500);

  // --- State for Modals ---
  const [formModalState, setFormModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    couponId: string | null;
  }>({
    isOpen: false,
    mode: "create",
    couponId: null,
  });

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    couponToDelete: { id: "", code: "" },
  });

  // --- Mutations & Queries ---
  const queryParams: GetCouponsParams = useMemo(() => {
    const getValidDiscountType = (value: string): DiscountType | undefined => {
      if (value === "percentage" || value === "fixed_amount") {
        return value;
      }
      return undefined;
    };

    return {
      page: currentPage,
      limit,
      code: debouncedCode || undefined,
      isActive:
        filters.isActive === "" ? undefined : filters.isActive === "true",
      discountType: getValidDiscountType(filters.discountType),
    };
  }, [
    currentPage,
    limit,
    debouncedCode,
    filters.isActive,
    filters.discountType,
  ]);

  const {
    data: paginatedData,
    isLoading: isLoadingList,
    isError,
    error,
    refetch,
  } = useGetAdminCoupons(queryParams);

  const shouldFetchCoupon =
    formModalState.isOpen &&
    formModalState.mode === "edit" &&
    !!formModalState.couponId;

  const { data: couponToEdit, isLoading: isLoadingDetail } =
    useGetAdminCouponById(shouldFetchCoupon ? formModalState.couponId! : "");

  const createCouponMutation = useCreateCoupon();
  const updateCouponMutation = useUpdateCoupon();
  const deleteCouponMutation = useDeleteCouponAdmin();

  // --- URL Sync Effect ---
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const updateParam = (
      key: string,
      value: string | number | undefined,
      defaultValue?: unknown,
    ) => {
      if (
        value !== undefined &&
        String(value) !== "" &&
        value !== defaultValue
      ) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    };
    updateParam("page", currentPage, 1);
    updateParam("limit", limit, defaultLimitFromSettings);
    updateParam("code", debouncedCode);
    updateParam("isActive", filters.isActive);
    updateParam("discountType", filters.discountType);

    if (params.toString() !== searchParams.toString()) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams, router, pathname, searchParams, debouncedCode, filters]);

  // --- Handlers ---
  const handleFilterChange = (
    filterName: keyof typeof filters,
    value: string,
  ) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ code: "", isActive: "", discountType: "" });
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const handleOpenCreateModal = () => {
    setFormModalState({ isOpen: true, mode: "create", couponId: null });
  };

  const handleOpenEditModal = (couponId: string) => {
    setFormModalState({ isOpen: true, mode: "edit", couponId });
  };

  const handleCloseFormModal = () => {
    setFormModalState({ isOpen: false, mode: "create", couponId: null });
  };

  const handleFormSubmit = (formData: Partial<CouponFormData>) => {
    if (formModalState.mode === "create") {
      createCouponMutation.mutate(formData, {
        onSuccess: handleCloseFormModal,
      });
    } else {
      updateCouponMutation.mutate(
        { id: formModalState.couponId!, payload: formData },
        {
          onSuccess: handleCloseFormModal,
        },
      );
    }
  };

  const handleOpenDeleteModal = (couponId: string, couponCode: string) => {
    setDeleteModalState({
      isOpen: true,
      couponToDelete: { id: couponId, code: couponCode },
    });
  };

  const handleConfirmDelete = () => {
    deleteCouponMutation.mutate(deleteModalState.couponToDelete.id, {
      onSuccess: () =>
        setDeleteModalState({
          isOpen: false,
          couponToDelete: { id: "", code: "" },
        }),
    });
  };

  const isSubmittingForm =
    createCouponMutation.isPending || updateCouponMutation.isPending;
  const hasActiveFilters = !!(
    filters.code ||
    filters.isActive ||
    filters.discountType
  );

  if (isError) {
    return (
      <CCard className="mb-4">
        <CCardHeader>{t("errorTitle")}</CCardHeader>
        <CCardBody className="p-5 text-center">
          <CIcon icon={cilWarning} size="xl" className="text-danger mb-3" />
          <p className="text-danger">{t("errorMessage")}</p>
          <p className="text-muted text-sm">{error?.message}</p>
          <CButton color="primary" onClick={() => refetch()} className="mt-3">
            {t("retryButton")}
          </CButton>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm">
          <CCardHeader className="border-b bg-white !p-4">
            <div className="d-flex align-items-center mb-3">
              <h4 className="fw-semibold text-dark mb-0">{t("title")}</h4>
              {hasActiveFilters && (
                <CBadge color="info" className="ms-2 px-2 py-1">
                  {t("results", { count: paginatedData?.totalCoupons || 0 })}
                </CBadge>
              )}
            </div>
            <CouponFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              clearFilters={clearFilters}
              onAddNewClick={handleOpenCreateModal}
            />
          </CCardHeader>
          <CCardBody className="position-relative p-0">
            {/* Trường hợp 1: Đang tải lần đầu tiên */}
            {isLoadingList && !paginatedData && (
              <div className="p-5 text-center">
                <CSpinner color="primary" />
                <p className="text-muted mt-2">{t("loading")}</p>
              </div>
            )}

            {/* Trường hợp 2: Load xong nhưng không có dữ liệu */}
            {!isLoadingList && paginatedData?.coupons.length === 0 && (
              <div className="p-5 text-center">
                <CIcon
                  icon={cilWarning}
                  size="xl"
                  className="text-secondary mb-2"
                />
                <p className="text-muted mb-0">
                  {hasActiveFilters
                    ? t("noResultsWithFilter")
                    : t("noCouponsYet")}
                </p>
              </div>
            )}

            {/* Trường hợp 3: Có dữ liệu để hiển thị */}
            {paginatedData && paginatedData.coupons.length > 0 && (
              <>
                <CouponTable
                  coupons={paginatedData.coupons}
                  onDeleteClick={handleOpenDeleteModal}
                  onEditClick={handleOpenEditModal}
                  displayCurrency={displayCurrency}
                  rates={rates}
                />
                {/* Lớp phủ loading khi fetch lại trong nền */}
                {isLoadingList && (
                  <div className="position-absolute d-flex align-items-center justify-content-center bg-opacity-50 start-0 top-0 z-2 h-100 w-100 bg-white">
                    <CSpinner color="primary" />
                  </div>
                )}
              </>
            )}
          </CCardBody>
          {paginatedData && paginatedData.totalCoupons > 0 && (
            <DataTablePagination
              currentPage={paginatedData.currentPage}
              totalPages={paginatedData.totalPages}
              totalItems={paginatedData.totalCoupons}
              limit={paginatedData.limit}
              onPageChange={setCurrentPage}
              onLimitChange={handleLimitChange}
              itemType={tAdmin("breadcrumbs.coupons", {
                count: 2,
              }).toLowerCase()}
              defaultLimitFromSettings={defaultLimitFromSettings}
            />
          )}
        </CCard>
      </CCol>

      <CModal
        visible={formModalState.isOpen}
        onClose={handleCloseFormModal}
        size="lg"
        alignment="center"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>
            {formModalState.mode === "create"
              ? tForm("createTitle")
              : tForm("editTitle")}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {formModalState.mode === "edit" && isLoadingDetail ? (
            <div className="p-5 text-center">
              <CSpinner />
            </div>
          ) : (
            <CouponForm
              key={formModalState.couponId || "create"}
              initialData={
                formModalState.mode === "edit" ? couponToEdit : undefined
              }
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmittingForm}
              onClose={handleCloseFormModal}
            />
          )}
        </CModalBody>
      </CModal>

      <ConfirmationModal
        visible={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState({ ...deleteModalState, isOpen: false })
        }
        onConfirm={handleConfirmDelete}
        isConfirming={deleteCouponMutation.isPending}
        title={tDelete("title")}
        body={tDelete("body", { code: deleteModalState.couponToDelete.code })}
        confirmButtonText={tShared("confirm")}
        cancelButtonText={tShared("cancel")}
      />
    </CRow>
  );
}
