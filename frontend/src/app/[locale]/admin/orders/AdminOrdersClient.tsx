"use client";

import { useSettings } from "@/app/SettingsContext";
import DataTablePagination from "@/components/admin/layout/DataTablePagination";
import OrderFilters from "@/components/admin/orders/OrderFilters";
import OrderTable from "@/components/admin/orders/OrderTable";
import useDebounce from "@/hooks/useDebounce";
import { useGrabToScroll } from "@/hooks/useGrabToScroll";
import { useGetAllOrdersAdmin } from "@/lib/react-query/orderQueries";
import { GetAllOrdersAdminParams } from "@/services/orderService";
import { OrderSummary } from "@/types";
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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminOrdersClient() {
  const router = useRouter();
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();
  const scrollableContainerRef = useGrabToScroll<HTMLDivElement>();
  const { settings } = useSettings();

  const defaultLimitFromSettings =
    settings?.adminTable?.defaultItemsPerPage || 10;

  // --- States for Filters and Pagination ---
  const [currentPage, setCurrentPage] = useState<number>(
    Number(currentSearchParams.get("page")) || 1,
  );
  const [limit, setLimit] = useState<number>(
    Number(currentSearchParams.get("limit")) || defaultLimitFromSettings,
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    currentSearchParams.get("search") || "",
  );
  const [sortBy, setSortBy] = useState<string>(
    currentSearchParams.get("sortBy") || "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (currentSearchParams.get("sortOrder") as "asc" | "desc") || "desc",
  );
  const [filterStatus, setFilterStatus] = useState<string>(
    currentSearchParams.get("status") || "",
  );
  const [filterStartDate, setFilterStartDate] = useState<string>(
    currentSearchParams.get("startDate") || "",
  );
  const [filterEndDate, setFilterEndDate] = useState<string>(
    currentSearchParams.get("endDate") || "",
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const currentQueryString = currentSearchParams.toString();

  // --- Data Fetching ---
  const queryParams: GetAllOrdersAdminParams = useMemo(
    () => ({
      page: currentPage,
      limit: limit,
      search: debouncedSearchTerm || undefined,
      sortBy,
      sortOrder,
      status: filterStatus || undefined,
      startDate: filterStartDate || undefined,
      endDate: filterEndDate || undefined,
    }),
    [
      currentPage,
      limit,
      debouncedSearchTerm,
      sortBy,
      sortOrder,
      filterStatus,
      filterStartDate,
      filterEndDate,
    ],
  );

  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllOrdersAdmin(queryParams, {
    placeholderData: (previousData) => previousData,
  });

  // --- URL Sync Effect ---
  useEffect(() => {
    const params = new URLSearchParams(currentSearchParams);
    const updateParam = (
      key: string,
      value: string | number,
      defaultValue?: unknown,
    ) => {
      if (value && value !== defaultValue) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    };
    updateParam("page", currentPage, 1);
    updateParam("limit", limit, defaultLimitFromSettings);
    updateParam("search", debouncedSearchTerm);
    updateParam("sortBy", sortBy, "createdAt");
    updateParam("sortOrder", sortOrder, "desc");
    updateParam("status", filterStatus);
    updateParam("startDate", filterStartDate);
    updateParam("endDate", filterEndDate);

    if (params.toString() !== currentSearchParams.toString()) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [
    currentPage,
    limit,
    debouncedSearchTerm,
    sortBy,
    sortOrder,
    filterStatus,
    filterStartDate,
    filterEndDate,
    pathname,
    router,
    currentSearchParams,
    defaultLimitFromSettings,
  ]);

  // --- Handlers ---
  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy);
    setSortOrder((prev) =>
      sortBy === newSortBy && prev === "desc" ? "asc" : "desc",
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterStartDate("");
    setFilterEndDate("");
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(
    debouncedSearchTerm ||
    filterStatus ||
    filterStartDate ||
    filterEndDate
  );
  const orders: OrderSummary[] = paginatedData?.orders || [];
  const totalPages = paginatedData?.totalPages || 1;

  if (isError) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>Lỗi</CCardHeader>
            <CCardBody className="p-5 text-center">
              <CIcon icon={cilWarning} size="xl" className="text-danger mb-3" />
              <p className="text-danger">Không thể tải danh sách đơn hàng.</p>
              <p className="text-muted text-sm">{error?.message}</p>
              <CButton
                color="primary"
                onClick={() => refetch()}
                className="mt-3"
              >
                Thử lại
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
              <h4 className="fw-semibold text-dark mb-0">Quản lý Đơn hàng</h4>
              {hasActiveFilters && (
                <CBadge color="info" className="ms-2 px-2 py-1">
                  {paginatedData?.totalOrders || 0} kết quả
                </CBadge>
              )}
            </div>
            <OrderFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}
              filterStartDate={filterStartDate}
              setFilterStartDate={(value) => {
                setFilterStartDate(value);
                setCurrentPage(1);
              }}
              filterEndDate={filterEndDate}
              setFilterEndDate={(value) => {
                setFilterEndDate(value);
                setCurrentPage(1);
              }}
              clearFilters={clearFilters}
            />
          </CCardHeader>

          <CCardBody
            ref={scrollableContainerRef}
            className="position-relative grabbable p-0"
            style={{ overflow: "auto" }}
          >
            {isLoading && !orders.length ? (
              <div className="p-5 text-center">
                <CSpinner color="primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-muted mb-0">
                  {hasActiveFilters
                    ? "Không tìm thấy đơn hàng nào phù hợp."
                    : "Chưa có đơn hàng nào."}
                </p>
              </div>
            ) : (
              <>
                <OrderTable
                  orders={orders}
                  handleSort={handleSort}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  queryString={currentQueryString}
                />
                {isLoading && (
                  <div className="position-absolute d-flex align-items-center justify-content-center bg-opacity-75 start-0 top-0 z-3 h-100 w-100 bg-white">
                    <CSpinner color="primary" />
                  </div>
                )}
              </>
            )}
          </CCardBody>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={paginatedData?.totalOrders || 0}
            limit={limit}
            onPageChange={setCurrentPage}
            onLimitChange={handleLimitChange}
            itemType="đơn hàng"
            defaultLimitFromSettings={defaultLimitFromSettings}
          />
        </CCard>
      </CCol>
    </CRow>
  );
}
