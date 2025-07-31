"use client";

import NotificationItem from "@/components/admin/notifications/NotificationItem";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
} from "@/lib/react-query/notificationQueries";
import { getAdminNotificationsApi } from "@/services/notificationService";
import { cilCheckAlt } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from "@coreui/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useInView } from "react-intersection-observer";
import { useTranslations } from "next-intl";

const NOTIFICATIONS_PER_PAGE = 20;

export default function AdminNotificationsClient() {
  const t = useTranslations("AdminNotifications.list");

  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["adminAllNotifications"],
    queryFn: ({ pageParam = 1 }) =>
      getAdminNotificationsApi({
        page: pageParam,
        limit: NOTIFICATIONS_PER_PAGE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
  });

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(data.message || t("markAllAsReadSuccess"));
      },
    });
  };

  const allNotifications =
    data?.pages.flatMap((page) => page.notifications) ?? [];

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="shadow-sm">
          <CCardHeader className="flex items-center justify-between">
            <h5 className="mb-0 font-semibold">{t("title")}</h5>
            <CButton
              size="sm"
              color="light"
              onClick={handleMarkAllRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CIcon icon={cilCheckAlt} className="me-2" />
              {t("markAllAsRead")}
            </CButton>
          </CCardHeader>
          <CCardBody>
            {status === "pending" ? (
              <div className="p-10 text-center">
                <CSpinner />
                <span className="ml-2">{t("loading")}</span>
              </div>
            ) : status === "error" ? (
              <div className="p-10 text-center text-red-600">
                {t("error", { message: error.message })}
              </div>
            ) : (
              <div className="space-y-2">
                {allNotifications.length === 0 && (
                  <p className="py-10 text-center text-gray-500">
                    {t("noNotifications")}
                  </p>
                )}
                {allNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onMarkAsRead={() => {
                      if (!notification.isRead) {
                        markAsReadMutation.mutate(notification._id);
                      }
                    }}
                  />
                ))}
                {/* Element để trigger infinite scroll */}
                <div ref={ref} className="h-10">
                  {isFetchingNextPage && (
                    <div className="pt-4 text-center">
                      <CSpinner size="sm" />
                      <span className="ml-2 text-sm text-gray-500">{t("loadingMore")}</span>
                    </div>
                  )}
                  {!hasNextPage && allNotifications.length > 0 && (
                    <p className="pt-4 text-center text-sm text-gray-400">
                      {t("endOfList")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
}
