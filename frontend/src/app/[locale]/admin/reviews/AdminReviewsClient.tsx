"use client";

import { useSettings } from "@/app/SettingsContext";
import DataTablePagination from "@/components/admin/layout/DataTablePagination";
import ReviewFilters from "@/components/admin/reviews/ReviewFilters";
import ReviewTable from "@/components/admin/reviews/ReviewTable";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import useDebounce from "@/hooks/useDebounce";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  useAddAdminReply,
  useApproveReviewAdmin,
  useDeleteReviewAdmin,
  useGetAllReviewsAdmin,
  useRejectReviewAdmin,
} from "@/lib/react-query/reviewQueries";
import { Review } from "@/types";
import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from "@coreui/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export default function AdminReviewsClient() {
  const t = useTranslations("AdminReviews.list");
  const tAdmin = useTranslations("Admin");
  const tReply = useTranslations("AdminReviews.replyModal");
  const tDelete = useTranslations("AdminReviews.deleteModal");
  const tShared = useTranslations("Shared.confirmModal");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const defaultLimitFromSettings =
    settings?.adminTable?.defaultItemsPerPage || 10;

  const [filters, setFilters] = useState({
    isApproved: searchParams.get("isApproved") || "",
    rating: searchParams.get("rating") || "",
    searchComment: searchParams.get("searchComment") || "",
  });
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [limit, setLimit] = useState(
    Number(searchParams.get("limit")) || defaultLimitFromSettings,
  );
  const debouncedSearch = useDebounce(filters.searchComment, 500);

  const [replyModal, setReplyModal] = useState<{
    isOpen: boolean;
    review: Review | null;
    comment: string;
  }>({ isOpen: false, review: null, comment: "" });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    reviewId: string | null;
    author: string;
  }>({ isOpen: false, reviewId: null, author: "" });

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit,
      isApproved:
        filters.isApproved === "" ? undefined : filters.isApproved === "true",
      rating: filters.rating ? Number(filters.rating) : undefined,
      searchComment: debouncedSearch || undefined,
    }),
    [currentPage, limit, filters, debouncedSearch],
  );

  const { data, isLoading, isError, error, refetch } =
    useGetAllReviewsAdmin(queryParams);

  const approveMutation = useApproveReviewAdmin();
  const rejectMutation = useRejectReviewAdmin();
  const deleteMutation = useDeleteReviewAdmin();
  const replyMutation = useAddAdminReply();

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
    updateParam("isApproved", filters.isApproved);
    updateParam("rating", filters.rating);
    updateParam("searchComment", debouncedSearch);

    if (params.toString() !== searchParams.toString()) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [
    queryParams,
    router,
    pathname,
    searchParams,
    filters,
    debouncedSearch,
    currentPage,
    limit,
    defaultLimitFromSettings,
  ]);

  const handleFilterChange = (
    filterName: keyof typeof filters,
    value: string,
  ) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ isApproved: "", rating: "", searchComment: "" });
    setCurrentPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const handleReplySubmit = () => {
    if (!replyModal.review || !replyModal.comment.trim()) {
      toast.error(tReply("emptyReplyError"));
      return;
    }
    replyMutation.mutate(
      {
        reviewId: replyModal.review._id,
        payload: { comment: replyModal.comment },
      },
      {
        onSuccess: () =>
          setReplyModal({ isOpen: false, review: null, comment: "" }),
      },
    );
  };

  const handleDeleteSubmit = () => {
    if (deleteModal.reviewId) {
      deleteMutation.mutate(deleteModal.reviewId, {
        onSuccess: () =>
          setDeleteModal({ isOpen: false, reviewId: null, author: "" }),
      });
    }
  };

  const hasActiveFilters = !!(
    filters.isApproved ||
    filters.rating ||
    filters.searchComment
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
        <CCard className="shadow-sm">
          <CCardHeader className="border-b bg-white !p-4">
            <div className="d-flex align-items-center mb-3">
              <h4 className="fw-semibold text-dark mb-0">{t("title")}</h4>
              {hasActiveFilters && (
                <CBadge color="info" className="ms-2 px-2 py-1">
                  {t("results", { count: data?.totalReviews || 0 })}
                </CBadge>
              )}
            </div>
            <ReviewFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              clearFilters={clearFilters}
            />
          </CCardHeader>
          <CCardBody className="position-relative p-0">
            {/* Trường hợp 1: Đang tải lần đầu tiên */}
            {isLoading && !data && (
              <div className="p-5 text-center">
                <CSpinner />
                <p className="text-muted mt-2">{t("loading")}</p>
              </div>
            )}

            {/* Trường hợp 2: Load xong nhưng không có dữ liệu */}
            {!isLoading && data?.reviews.length === 0 && (
              <div className="p-5 text-center">
                <CIcon
                  icon={cilWarning}
                  size="xl"
                  className="text-secondary mb-2"
                />
                <p className="text-muted mb-0">
                  {hasActiveFilters
                    ? t("noResultsWithFilter")
                    : t("noReviewsYet")}
                </p>
              </div>
            )}

            {/* Trường hợp 3: Có dữ liệu để hiển thị */}
            {data && data.reviews.length > 0 && (
              <>
                <ReviewTable
                  reviews={data.reviews}
                  onApprove={(id) => approveMutation.mutate(id)}
                  onReject={(id) => rejectMutation.mutate(id)}
                  onDelete={(id, author) =>
                    setDeleteModal({ isOpen: true, reviewId: id, author })
                  }
                  onReply={(review) =>
                    setReplyModal({
                      isOpen: true,
                      review,
                      comment: review.adminReply?.comment || "",
                    })
                  }
                />
                {/* Lớp phủ loading khi fetch lại trong nền */}
                {isLoading && (
                  <div className="position-absolute d-flex align-items-center justify-content-center bg-opacity-50 start-0 top-0 z-2 h-100 w-100 bg-white">
                    <CSpinner />
                  </div>
                )}
              </>
            )}
          </CCardBody>
          {data && data.totalReviews > 0 && (
            <DataTablePagination
              currentPage={data.currentPage}
              totalPages={data.totalPages}
              totalItems={data.totalReviews}
              limit={data.limit}
              onPageChange={setCurrentPage}
              onLimitChange={handleLimitChange}
              itemType={tAdmin("breadcrumbs.reviews", {
                count: 2,
              }).toLowerCase()}
              defaultLimitFromSettings={defaultLimitFromSettings}
            />
          )}
        </CCard>
      </CCol>

      {/* Modals */}
      <CModal
        visible={replyModal.isOpen}
        onClose={() => setReplyModal((prev) => ({ ...prev, isOpen: false }))}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>{tReply("title")}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-2 text-sm text-gray-600">
            {tReply.rich("reviewBy", {
              name: replyModal.review?.user.name ?? "",
              bold: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>

          <blockquote className="mb-4 border-l-4 bg-gray-100 p-2 text-sm">
            &quot;{replyModal.review?.comment}&quot;
          </blockquote>
          <CFormTextarea
            rows={4}
            placeholder={tReply("commentPlaceholder")}
            value={replyModal.comment}
            onChange={(e) =>
              setReplyModal((prev) => ({ ...prev, comment: e.target.value }))
            }
          />
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() =>
              setReplyModal((prev) => ({ ...prev, isOpen: false }))
            }
          >
            {tReply("cancel")}
          </CButton>
          <CButton
            color="primary"
            onClick={handleReplySubmit}
            disabled={replyMutation.isPending}
          >
            {replyMutation.isPending ? (
              <CSpinner size="sm" />
            ) : (
              tReply("submit")
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      <ConfirmationModal
        visible={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, reviewId: null, author: "" })
        }
        onConfirm={handleDeleteSubmit}
        isConfirming={deleteMutation.isPending}
        title={tDelete("title")}
        body={tDelete("body", { author: deleteModal.author })}
        confirmButtonColor="danger"
        confirmButtonText={tShared("confirm")}
        cancelButtonText={tShared("cancel")}
      />
    </CRow>
  );
}
