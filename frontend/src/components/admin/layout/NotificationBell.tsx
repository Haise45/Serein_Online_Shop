"use client";
import "@/app/globals.css";
import {
  notificationKeys,
  useGetAdminNotifications,
  useGetAdminUnreadNotificationCount,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
} from "@/lib/react-query/notificationQueries";
import RelativeTime from "@/components/shared/RelativeTime";
import { RootState } from "@/store";
import { Notification } from "@/types/notification";
import {
  cilBell,
  cilBellExclamation,
  cilCart,
  cilCheck,
  cilCheckAlt,
  cilCommentSquare,
  cilExternalLink,
  cilTruck,
  cilUserFollow,
  cilX,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CSpinner,
  CToast,
  CToastBody,
  CToastHeader,
  CToaster,
} from "@coreui/react";
import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";
import { useTranslations } from "next-intl";

// Helper hiển thị icon cho từng loại notification
export const getNotificationIcon = (
  type: Notification["type"],
  t: ReturnType<typeof useTranslations>,
) => {
  const iconMap: Partial<
    Record<
      Notification["type"],
      { icon: string[]; color: string; bgColor: string }
    >
  > = {
    NEW_USER_REGISTERED: {
      icon: cilUserFollow,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    NEW_ORDER_PLACED: {
      icon: cilCart,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    ORDER_STATUS_SHIPPED: {
      icon: cilTruck,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    ORDER_STATUS_DELIVERED: {
      icon: cilCheck,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    ORDER_CANCELLATION_REQUESTED: {
      icon: cilX,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    ORDER_REFUND_REQUESTED: {
      icon: cilX,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    ORDER_CANCELLATION_APPROVED: {
      icon: cilCheckAlt,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    ORDER_CANCELLATION_REJECTED: {
      icon: cilX,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    ORDER_REFUND_APPROVED: {
      icon: cilCheckAlt,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    ORDER_REFUND_REJECTED: {
      icon: cilX,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    PRODUCT_LOW_STOCK: {
      icon: cilBellExclamation,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    PRODUCT_OUT_OF_STOCK: {
      icon: cilBellExclamation,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    NEW_REVIEW_SUBMITTED: {
      icon: cilCommentSquare,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    REVIEW_APPROVED: {
      icon: cilCheckAlt,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
  };

  const config = iconMap[type] || {
    icon: cilBell,
    color: "text-gray-500",
    bgColor: "bg-gray-50",
  };
  // Lấy label từ hàm dịch, fallback về UNKNOWN
  const label = t(`labels.${type}`) || t("labels.UNKNOWN");

  return {
    icon: <CIcon icon={config.icon} className={`h-4 w-4 ${config.color}`} />,
    bgColor: config.bgColor,
    label: label,
  };
};

// Interface cho một toast item
interface ToastMessage {
  id: number;
  title: string;
  message: React.ReactNode;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "light"
    | "dark";
  icon?: React.ReactNode;
}

const NotificationBell = () => {
  const t = useTranslations("Admin.notifications");
  const queryClient = useQueryClient();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]); // State cho CoreUI toasts
  const notificationRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const { data: notificationsData, isLoading } = useGetAdminNotifications(
    { limit: 8, isRead: false },
    { enabled: !!user, staleTime: 1000 * 30 },
  );
  const notifications = notificationsData?.notifications || [];

  const { data: unreadCount } = useGetAdminUnreadNotificationCount({
    enabled: !!user,
    staleTime: 1000 * 30,
  });

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // Hàm thêm toast mới vào danh sách
  const addToast = (toast: Omit<ToastMessage, "id">) => {
    setToasts((prevToasts) => [...prevToasts, { ...toast, id: Date.now() }]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationReceived = useCallback(
    (newNotification: Notification) => {
      try {
        const { icon } = getNotificationIcon(newNotification.type, t);
        addToast({
          title: newNotification.title,
          message: newNotification.message,
          color: "info",
          icon,
        });

        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: notificationKeys.adminList({ limit: 8, isRead: false }),
          });
          queryClient.invalidateQueries({
            queryKey: notificationKeys.adminUnreadCount(),
          });
        }, 200);
      } catch (error) {
        console.error("Error handling notification:", error);
      }
    },
    [queryClient, t],
  );

  // useEffect cho Socket.IO
  useEffect(() => {
    if (!accessToken || user?.role !== "admin") return;
    const socket = io(
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
      {
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 3,
        timeout: 5000,
      },
    );
    socketRef.current = socket;
    socket.on("new_admin_notification", (newNotification: Notification) => {
      handleNotificationReceived(newNotification);
    });
    socket.connect();
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [accessToken, user?.role, handleNotificationReceived]);

  const toggleNotifications = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsOpen((prev) => !prev);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.isRead) markAsReadMutation.mutate(notification._id);
      setIsOpen(false);
      if (notification.link)
        setTimeout(() => router.push(notification.link!), 100);
    },
    [markAsReadMutation, router],
  );

  const handleMarkAllRead = useCallback(() => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        addToast({
          title: t("toastSuccessTitle"),
          message: t("markAllAsReadSuccess"),
          color: "success",
          icon: <CIcon icon={cilCheckAlt} />,
        });
      },
    });
  }, [markAllAsReadMutation, t]);

  const handleViewAllNotifications = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => router.push("/admin/notifications"), 100);
  }, [router]);

  return (
    <div className="relative" ref={notificationRef}>
      <CToaster placement="top-end" className="p-3">
        {toasts.map((toast) => (
          <CToast
            key={toast.id}
            autohide={true}
            delay={4000}
            visible={true}
            color={toast.color}
            className="text-white"
            onClose={() => {
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }}
          >
            <CToastHeader closeButton>
              {toast.icon && <span className="me-2">{toast.icon}</span>}
              <strong className="me-auto">{toast.title}</strong>
              <small>{t("toastJustNow")}</small>
            </CToastHeader>
            <CToastBody>{toast.message}</CToastBody>
          </CToast>
        ))}
      </CToaster>

      <button
        onClick={toggleNotifications}
        disabled={isAnimating}
        className={classNames(
          "relative rounded-full p-2 transition-all duration-200",
          "hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none",
          isOpen && "bg-blue-50 text-blue-600",
          isAnimating && "cursor-not-allowed opacity-75",
        )}
        title={t("title")}
      >
        <CIcon
          icon={unreadCount && unreadCount > 0 ? cilBellExclamation : cilBell}
          size="lg"
          className={classNames(
            "transition-transform duration-200",
            unreadCount && unreadCount > 0 && "animate-pulse",
          )}
        />
        {typeof unreadCount === "number" && (
          <span
            className={classNames(
              "absolute -top-1 -right-1 inline-flex transform items-center justify-center rounded-full px-2 py-1 text-xs leading-none font-bold text-white",
              unreadCount > 0 ? "animate-bounce bg-red-500" : "bg-gray-400",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={classNames(
            "absolute top-full right-0 mt-2 w-96 rounded-xl bg-white shadow-2xl",
            "z-50 overflow-hidden border border-gray-200",
            "transform transition-all duration-300 ease-out",
            "animate-in slide-in-from-top-2 fade-in-0",
          )}
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="m-0 text-lg font-semibold text-white">
                  {t("title")}
                </h3>
                <span className="text-sm text-blue-100">
                  {(unreadCount ?? 0) > 0
                    ? t("unreadCount", { count: unreadCount ?? 0 })
                    : t("noNew")}
                </span>
              </div>
              {(unreadCount ?? 0) > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="flex items-center space-x-1 text-sm text-blue-100 transition-colors duration-200 hover:text-white disabled:opacity-50"
                  title="Đánh dấu tất cả đã đọc"
                >
                  {markAllAsReadMutation.isPending ? (
                    <CSpinner size="sm" />
                  ) : (
                    <CIcon icon={cilCheckAlt} className="h-4 w-4" />
                  )}
                  <span>{t("markAllAsRead")}</span>
                </button>
              )}
            </div>
          </div>

          <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <CSpinner size="sm" className="text-blue-500" />
                <span className="ml-2 text-gray-500">{t("loading")}</span>
              </div>
            )}
            {!isLoading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-12">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <CIcon icon={cilBell} className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-center text-gray-500">{t("emptyState")}</p>
                <p className="mt-1 text-center text-sm text-gray-400">
                  {t("emptyStateSubtitle")}
                </p>
              </div>
            )}
            {notifications.map((notification) => {
              const { icon, bgColor, label } = getNotificationIcon(
                notification.type,
                t,
              );
              return (
                <div
                  key={notification._id}
                  className={classNames(
                    "border-b border-gray-100 transition-all duration-200 last:border-b-0",
                    "group cursor-pointer hover:bg-gray-50",
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-4">
                    <div className="flex items-start space-x-3">
                      <div
                        className={classNames(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                          bgColor,
                        )}
                      >
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p
                              className={classNames(
                                "line-clamp-2 text-sm font-medium text-gray-900",
                                !notification.isRead && "font-semibold",
                              )}
                            >
                              {notification.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                              {notification.message}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                <RelativeTime date={notification.createdAt} />
                              </span>
                              <span
                                className={classNames(
                                  "rounded-full px-2 py-1 text-xs font-medium",
                                  notification.isRead
                                    ? "bg-gray-100 text-gray-600"
                                    : "bg-blue-100 text-blue-600",
                                )}
                              >
                                {label}
                              </span>
                            </div>
                          </div>
                          {!notification.isRead && (
                            <div className="ml-2 flex-shrink-0">
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            </div>
                          )}
                          {notification.link && (
                            <CIcon
                              icon={cilExternalLink}
                              className="ml-2 h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
              <button
                onClick={handleViewAllNotifications}
                className="flex w-full items-center justify-center space-x-2 rounded-lg px-4 py-2 text-center text-sm font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50 hover:text-blue-700"
                title={t("viewAllTitle")}
              >
                <span>{t("viewAll")}</span>
                <CIcon icon={cilExternalLink} className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
