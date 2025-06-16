import {
  getAdminNotificationsApi,
  GetAdminNotificationsParams,
  markAdminNotificationAsReadApi,
  markAllAdminNotificationsAsReadApi,
} from "@/services/notificationService";
import {
  Notification,
  PaginatedNotificationsResponse,
} from "@/types/notification";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";

export const notificationKeys = {
  allAdmin: ["adminNotifications"] as const,
  adminLists: () => [...notificationKeys.allAdmin, "list"] as const,
  adminList: (params: GetAdminNotificationsParams | undefined) =>
    [...notificationKeys.adminLists(), params || {}] as const,
  adminUnreadCount: () =>
    [...notificationKeys.allAdmin, "unreadCount"] as const,
};

type MutationOptions<TData, TVariables = void> = Omit<
  UseMutationOptions<
    TData,
    AxiosError<{ message?: string }>,
    TVariables,
    unknown
  >,
  "mutationFn"
>;

export const useGetAdminNotifications = (
  params?: GetAdminNotificationsParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedNotificationsResponse,
      AxiosError<{ message?: string }>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<
    PaginatedNotificationsResponse,
    AxiosError<{ message?: string }>
  >({
    queryKey: notificationKeys.adminList(params),
    queryFn: () => getAdminNotificationsApi(params),
    placeholderData: (previousData) => previousData,
    refetchInterval: 60000,
    ...options,
  });
};

export const useGetAdminUnreadNotificationCount = (
  options?: Omit<
    UseQueryOptions<number, AxiosError<{ message?: string }>>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<number, AxiosError<{ message?: string }>>({
    queryKey: notificationKeys.adminUnreadCount(),
    queryFn: async () => {
      const data = await getAdminNotificationsApi({ isRead: false, limit: 0 });
      return data.totalNotifications;
    },
    refetchInterval: 60000,
    ...options,
  });
};

export const useMarkNotificationAsRead = (
  options?: MutationOptions<Notification, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation<Notification, AxiosError<{ message?: string }>, string>({
    mutationFn: markAdminNotificationAsReadApi,
    onSuccess: (updatedNotification, notificationId, context) => {
      queryClient.setQueryData<PaginatedNotificationsResponse>(
        notificationKeys.adminList({ isRead: false }),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notifications: oldData.notifications.filter(
              (n) => n._id !== notificationId,
            ),
            totalNotifications: Math.max(0, oldData.totalNotifications - 1),
          };
        },
      );
      queryClient.setQueryData<PaginatedNotificationsResponse>(
        notificationKeys.adminList({}),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            notifications: oldData.notifications.map((n) =>
              n._id === notificationId ? { ...n, isRead: true } : n,
            ),
          };
        },
      );
      queryClient.invalidateQueries({
        queryKey: notificationKeys.adminUnreadCount(),
      });
      options?.onSuccess?.(updatedNotification, notificationId, context);
    },
    onError: (error, notificationId, context) => {
      options?.onError?.(error, notificationId, context);
    },
  });
};

export const useMarkAllNotificationsAsRead = (
  options?: MutationOptions<{ message: string; modifiedCount?: number }>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; modifiedCount?: number },
    AxiosError<{ message?: string }>,
    void
  >({
    mutationFn: markAllAdminNotificationsAsReadApi,
    onSuccess: (data, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.adminLists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.adminUnreadCount(),
      });
      options?.onSuccess?.(data, _variables, context);
    },
    onError: (error, _variables, context) => {
      options?.onError?.(error, _variables, context);
    },
  });
};
