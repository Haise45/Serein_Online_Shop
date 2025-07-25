"use client";

import { getNotificationIcon } from "@/components/admin/layout/NotificationBell";
import RelativeTime from "@/components/shared/RelativeTime";
import { Notification } from "@/types";
import classNames from "classnames";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const locale = useLocale();
  const router = useRouter();
  const tBell = useTranslations("Admin.notifications");
  const t = useTranslations("AdminNotifications.item");

  // Truyền hàm dịch vào helper
  const { icon, bgColor, label } = getNotificationIcon(
    notification.type,
    tBell,
  );

  const handleClick = () => {
    onMarkAsRead(); // Gọi hàm để đánh dấu đã đọc
    if (notification.link) {
      router.push(notification.link);
    }
  };

    return (
    <div
      onClick={handleClick}
      className={classNames(
        "flex items-start space-x-4 rounded-lg border p-4 transition-colors duration-200",
        notification.link && "cursor-pointer",
        notification.isRead
          ? "border-gray-200 bg-gray-50 text-gray-500"
          : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50",
      )}
    >
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
          <p
            className={classNames(
              "text-sm font-medium text-gray-900",
              !notification.isRead && "font-semibold",
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500"
              title={t("unreadTooltip")}
            ></span>
          )}
        </div>
        <p
          className={classNames(
            "mt-1 text-sm",
            notification.isRead ? "text-gray-600" : "text-gray-700",
          )}
        >
          {notification.message}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            <div
              title={new Date(notification.createdAt).toLocaleString(locale)}
            >
              <RelativeTime date={notification.createdAt} />
            </div>
          </span>
          <span
            className={classNames(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              notification.isRead
                ? "bg-gray-200 text-gray-700"
                : `${bgColor} ${icon.props.className.split(" ")[0]}`,
            )}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;