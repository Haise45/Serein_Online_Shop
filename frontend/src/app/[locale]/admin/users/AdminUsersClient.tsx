"use client";

import { useSettings } from "@/app/SettingsContext";
import DataTablePagination from "@/components/admin/layout/DataTablePagination";
import UserFilters from "@/components/admin/users/UserFilters";
import UserTable from "@/components/admin/users/UserTable";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import useDebounce from "@/hooks/useDebounce";
import {
  useGetAllUsersAdmin,
  useUpdateUserStatusAdmin,
} from "@/lib/react-query/userQueries";
import { User } from "@/types";
import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from "@coreui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminUsersClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const defaultLimitFromSettings =
    settings?.adminTable?.defaultItemsPerPage || 10;

  // --- States for Filters and Pagination ---
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams?.get("page")) || 1,
  );
  const [limit, setLimit] = useState(
    Number(searchParams?.get("limit")) || defaultLimitFromSettings,
  );
  const [searchTerm, setSearchTerm] = useState(
    searchParams?.get("search") || "",
  );
  const [filterRole, setFilterRole] = useState(searchParams?.get("role") || "");
  const [filterStatus, setFilterStatus] = useState(
    searchParams?.get("isActive") || "",
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const currentQueryString = searchParams?.toString() || "";

  // --- State for Modal ---
  const [suspendModalState, setSuspendModalState] = useState({
    isOpen: false,
    userToSuspend: null as User | null,
    reason: "",
    endDate: "",
  });

  const [reactivateModalState, setReactivateModalState] = useState({
    isOpen: false,
    userToReactivate: null as User | null,
  });

  // --- Mutations ---
  const updateUserStatusMutation = useUpdateUserStatusAdmin();

  // --- Data Fetching ---
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit,
      search: debouncedSearchTerm || undefined,
      role: filterRole || undefined,
      isActive: filterStatus === "" ? undefined : filterStatus === "true",
    }),
    [currentPage, limit, debouncedSearchTerm, filterRole, filterStatus],
  );

  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllUsersAdmin(queryParams);

  // --- Safe data access ---
  const users = Array.isArray(paginatedData?.users) ? paginatedData.users : [];
  const totalUsers = paginatedData?.totalUsers || 0;
  const currentPageFromData = paginatedData?.currentPage || 1;
  const totalPages = paginatedData?.totalPages || 0;
  const limitFromData = paginatedData?.limit || defaultLimitFromSettings;

  // --- URL Sync Effect ---
  useEffect(() => {
    if (!searchParams) return;

    const params = new URLSearchParams(searchParams);

    const updateParam = (
      key: string,
      value: string | number,
      defaultValue?: unknown,
    ) => {
      if (
        value !== undefined &&
        value !== null &&
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
    updateParam("search", debouncedSearchTerm);
    updateParam("role", filterRole);
    updateParam("isActive", filterStatus);

    // Chỉ push URL nếu có sự thay đổi thực sự
    const newParamsString = params.toString();
    const currentParamsString = searchParams?.toString() || "";

    if (newParamsString !== currentParamsString) {
      router.replace(`${pathname}?${newParamsString}`, { scroll: false });
    }
  }, [
    currentPage,
    limit,
    debouncedSearchTerm,
    filterRole,
    filterStatus,
    pathname,
    router,
    searchParams,
    defaultLimitFromSettings,
  ]);

  // --- Handlers ---
  const handleOpenSuspendModal = (user: User) => {
    setSuspendModalState({
      isOpen: true,
      userToSuspend: user,
      reason: "",
      endDate: "",
    });
  };

  const handleOpenReactivateModal = (user: User) => {
    setReactivateModalState({ isOpen: true, userToReactivate: user });
  };

  const handleConfirmSuspend = () => {
    const { userToSuspend, reason, endDate } = suspendModalState;
    if (userToSuspend && reason.trim()) {
      updateUserStatusMutation.mutate(
        {
          userId: userToSuspend._id,
          payload: {
            isActive: false,
            reason,
            suspensionEndDate: endDate || null,
          },
        },
        {
          onSuccess: () =>
            setSuspendModalState({
              isOpen: false,
              userToSuspend: null,
              reason: "",
              endDate: "",
            }),
        },
      );
    }
  };

  const handleConfirmReactivate = () => {
    const user = reactivateModalState.userToReactivate;
    if (user) {
      updateUserStatusMutation.mutate(
        { userId: user._id, payload: { isActive: true } },
        {
          onSuccess: () =>
            setReactivateModalState({ isOpen: false, userToReactivate: null }),
        },
      );
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi limit
  };

  const hasActiveFilters = !!(
    debouncedSearchTerm ||
    filterRole ||
    filterStatus
  );

  // Early return for error state
  if (isError) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>Lỗi</CCardHeader>
            <CCardBody className="p-5 text-center">
              <CIcon icon={cilWarning} size="xl" className="text-danger mb-3" />
              <p className="text-danger">Không thể tải danh sách người dùng.</p>
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

  // Show loading for initial load
  if (isLoading && !paginatedData) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="border-b bg-white !p-4">
              <h4 className="fw-semibold text-dark mb-0">Quản lý Người dùng</h4>
            </CCardHeader>
            <CCardBody className="p-5 text-center">
              <CSpinner color="primary" />
              <p className="text-muted mt-2">
                Đang tải danh sách người dùng...
              </p>
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
              <h4 className="fw-semibold text-dark mb-0">Quản lý Người dùng</h4>
              {hasActiveFilters && (
                <CBadge color="info" className="ms-2 px-2 py-1">
                  {totalUsers} kết quả
                </CBadge>
              )}
            </div>
            <UserFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterRole={filterRole}
              setFilterRole={(value) => {
                setFilterRole(value);
                setCurrentPage(1);
              }}
              filterStatus={filterStatus}
              setFilterStatus={(value) => {
                setFilterStatus(value);
                setCurrentPage(1);
              }}
            />
          </CCardHeader>
          <CCardBody className="position-relative p-0">
            {/* Trường hợp không có dữ liệu */}
            {!isLoading && users.length === 0 && (
              <div className="p-5 text-center">
                <CIcon
                  icon={cilWarning}
                  size="xl"
                  className="text-secondary mb-2"
                />
                <p className="text-muted mb-0">
                  {hasActiveFilters
                    ? "Không tìm thấy người dùng nào phù hợp."
                    : "Chưa có người dùng nào."}
                </p>
              </div>
            )}

            {/* Trường hợp có dữ liệu để hiển thị */}
            {users.length > 0 && (
              <>
                <UserTable
                  users={users}
                  onStatusChangeClick={(user) => {
                    if (user.isActive) {
                      handleOpenSuspendModal(user);
                    } else {
                      handleOpenReactivateModal(user);
                    }
                  }}
                  queryString={currentQueryString}
                />
                {/* Lớp phủ loading khi fetch lại trong nền */}
                {isLoading && (
                  <div className="position-absolute d-flex align-items-center justify-content-center bg-opacity-50 start-0 top-0 z-2 h-100 w-100 bg-white">
                    <CSpinner color="primary" />
                  </div>
                )}
              </>
            )}
          </CCardBody>

          {/* Pagination chỉ hiển thị khi có dữ liệu và totalPages > 0 */}
          {totalUsers > 0 && totalPages > 0 && (
            <DataTablePagination
              currentPage={currentPageFromData}
              totalPages={totalPages}
              totalItems={totalUsers}
              limit={limitFromData}
              onPageChange={setCurrentPage}
              onLimitChange={handleLimitChange}
              itemType="người dùng"
              defaultLimitFromSettings={defaultLimitFromSettings}
            />
          )}
        </CCard>
      </CCol>

      {/* Modal Đình chỉ */}
      <CModal
        visible={suspendModalState.isOpen}
        onClose={() =>
          setSuspendModalState((prev) => ({ ...prev, isOpen: false }))
        }
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            Đình chỉ tài khoản: {suspendModalState.userToSuspend?.name}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <label htmlFor="suspendReason" className="form-label">
              Lý do đình chỉ <span className="text-danger">*</span>
            </label>
            <CFormTextarea
              id="suspendReason"
              rows={4}
              placeholder="Ví dụ: Vi phạm điều khoản, spam,..."
              value={suspendModalState.reason}
              onChange={(e) =>
                setSuspendModalState((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="suspendEndDate" className="form-label">
              Ngày hết hạn đình chỉ (tùy chọn)
            </label>
            <CFormInput
              type="date"
              id="suspendEndDate"
              value={suspendModalState.endDate}
              onChange={(e) =>
                setSuspendModalState((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              min={new Date().toLocaleDateString("en-CA")}
            />
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() =>
              setSuspendModalState((prev) => ({ ...prev, isOpen: false }))
            }
          >
            Hủy
          </CButton>
          <CButton
            color="danger"
            onClick={handleConfirmSuspend}
            disabled={
              !suspendModalState.reason.trim() ||
              updateUserStatusMutation.isPending
            }
          >
            {updateUserStatusMutation.isPending
              ? "Đang xử lý..."
              : "Xác nhận đình chỉ"}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal Xác nhận kích hoạt lại */}
      <ConfirmationModal
        visible={reactivateModalState.isOpen}
        onClose={() =>
          setReactivateModalState({ isOpen: false, userToReactivate: null })
        }
        onConfirm={handleConfirmReactivate}
        isConfirming={updateUserStatusMutation.isPending}
        title="Xác nhận Kích hoạt lại"
        body={`Bạn có chắc muốn kích hoạt lại tài khoản cho người dùng "${reactivateModalState.userToReactivate?.name}"?`}
        confirmButtonText="Đồng ý kích hoạt"
        confirmButtonColor="success"
      />
    </CRow>
  );
}
