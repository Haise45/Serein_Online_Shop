import axiosInstance from "@/lib/axiosInstance";
import {
  Notification,
  PaginatedNotificationsResponse,
} from "@/types/notification";
import { AxiosError } from "axios";

const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

export interface GetAdminNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean; // Lọc theo đã đọc/chưa đọc
  type?: string; // Lọc theo loại thông báo
}

export const getAdminNotificationsApi = async (
  params?: GetAdminNotificationsParams,
): Promise<PaginatedNotificationsResponse> => {
  try {
    const { data } = await axiosInstance.get<PaginatedNotificationsResponse>(
      "/notifications/admin",
      { params },
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Không thể tải thông báo."));
  }
};

export const markAdminNotificationAsReadApi = async (
  notificationId: string,
): Promise<Notification> => {
  try {
    const { data } = await axiosInstance.put<Notification>(
      `/notifications/admin/${notificationId}/mark-as-read`,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Lỗi đánh dấu thông báo đã đọc."));
  }
};

export const markAllAdminNotificationsAsReadApi = async (): Promise<{
  message: string;
  modifiedCount?: number;
}> => {
  try {
    const { data } = await axiosInstance.put<{
      message: string;
      modifiedCount?: number;
    }>("/notifications/admin/mark-all-as-read");
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(err, "Lỗi đánh dấu tất cả thông báo đã đọc."),
    );
  }
};
