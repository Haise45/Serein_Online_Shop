import {
  approveRequestAdminApi,
  capturePayPalOrderApi,
  createOrderApi,
  createPayPalOrderApi,
  getAllOrdersAdminApi,
  GetAllOrdersAdminParams,
  getGuestOrderByTokenApi,
  getMyOrdersApi,
  GetMyOrdersParams,
  getOrderByIdApi,
  markOrderAsDeliveredApi,
  rejectRequestAdminApi,
  requestCancellationApi,
  requestRefundApi,
  restockOrderItemsAdminApi,
  updateOrderStatusAdminApi,
  UpdateOrderStatusAdminPayload,
} from "@/services/orderService";
import {
  OrderCreationPayload,
  OrderRequestPayload,
  ShippingAddressData,
} from "@/types/order";
import { Order, PaginatedOrdersResponse } from "@/types/order_model";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { cartKeys } from "./cartQueries";
import { useTranslations } from "next-intl";

// --- Query Keys for Order ---
// Định nghĩa kiểu cho params trong queryKey
type OrderListQueryParams =
  | GetMyOrdersParams
  | GetAllOrdersAdminParams
  | { admin?: boolean }
  | Record<string, unknown>;

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params: OrderListQueryParams) =>
    [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string | undefined) => [...orderKeys.details(), id] as const,
  guestDetail: (orderId?: string, token?: string) =>
    [...orderKeys.all, "guest", orderId, token] as const,
};

type MutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<
    TData,
    AxiosError<{ message?: string }>,
    TVariables,
    unknown
  >,
  "mutationFn"
>;

// Type cho options của useQuery nếu bạn muốn type chặt chẽ hơn
type CustomQueryOptions<
  TQueryFnData,
  TError = AxiosError<{ message?: string }>,
> = Omit<
  Parameters<typeof useQuery<TQueryFnData, TError>>[0], // Lấy type của object options từ useQuery
  "queryKey" | "queryFn"
>;

// --- Hook: Tạo đơn hàng mới ---
export const useCreateOrder = (
  options?: MutationOptions<Order, OrderCreationPayload>,
) => {
  const t = useTranslations("reactQuery.order");
  const queryClient = useQueryClient();
  return useMutation<
    Order,
    AxiosError<{ message?: string }>,
    OrderCreationPayload
  >({
    mutationFn: createOrderApi,
    onSuccess: (newOrder, variables, context) => {
      toast.success(
        t("createSuccess", { id: newOrder._id.toString().slice(-6) }),
      );
      // Gọi lại onSuccess gốc nếu có
      options?.onSuccess?.(newOrder, variables, context);
    },

    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message || error.message || t("createError"),
      );
      options?.onError?.(error, variables, context);
    },

    // onSettled sẽ chạy sau onSuccess hoặc onError.
    onSettled: (data, error, variables, context) => {
      // 1. Invalidate query giỏ hàng.
      // Invalidate sẽ đánh dấu là stale và refetch ở lần tiếp theo component active.
      queryClient.invalidateQueries({ queryKey: cartKeys.cart });

      // 2. Invalidate danh sách đơn hàng để nó được làm mới.
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

      // Gọi lại onSettled gốc nếu có
      options?.onSettled?.(data, error, variables, context);
    },

    ...options,
  });
};

// --- Hook: Lấy danh sách đơn hàng của tôi ---
export const useGetMyOrders = (
  params?: GetMyOrdersParams,
  options?: CustomQueryOptions<PaginatedOrdersResponse>, // Sử dụng CustomQueryOptions
) => {
  return useQuery<PaginatedOrdersResponse, AxiosError<{ message?: string }>>({
    queryKey: orderKeys.list(params || {}),
    queryFn: () => getMyOrdersApi(params),
    placeholderData: (previousData) => previousData, // Giữ lại dữ liệu trước đó
    ...options,
  });
};

// --- Hook: Guest lấy chi tiết đơn hàng bằng token ---
export const useGetGuestOrderByToken = (
  orderId?: string,
  token?: string,
  options?: Omit<
    UseQueryOptions<Order, AxiosError<{ message?: string }>>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<Order, AxiosError<{ message?: string }>>({
    queryKey: orderKeys.guestDetail(orderId, token),
    queryFn: () => {
      console.log(
        "[useGetGuestOrderByToken] queryFn called with orderId:",
        orderId,
        "token:",
        token,
      ); // DEBUG
      if (!orderId || !token) {
        // Rất quan trọng: Trả về một Promise bị reject hoặc ném lỗi
        // để React Query biết rằng query không thể thực hiện.
        // Không nên để nó tự động gọi API với undefined params.
        return Promise.reject(
          new Error("Order ID and Token are required for guest tracking."),
        );
      }
      return getGuestOrderByTokenApi(orderId, token);
    },
    enabled: !!orderId && !!token, // Điều kiện này vẫn đúng
    ...options,
  });
};

// --- Hook: Lấy chi tiết đơn hàng (User/Admin) ---
export const useGetOrderById = (
  orderId: string | undefined,
  options?: Omit<
    UseQueryOptions<Order, AxiosError<{ message?: string }>>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<Order, AxiosError<{ message?: string }>>({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => {
      if (!orderId) return Promise.reject(new Error("Order ID is required"));
      return getOrderByIdApi(orderId);
    },
    enabled: !!orderId, // Chỉ enable khi có orderId
    ...options,
  });
};

// --- Hook: User yêu cầu hủy đơn hàng ---
export const useRequestCancellation = (
  options?: MutationOptions<
    { message: string; order: Order },
    { orderId: string; payload: OrderRequestPayload }
  >,
) => {
  const t = useTranslations("reactQuery.order");
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; order: Order },
    AxiosError<{ message?: string }>,
    { orderId: string; payload: OrderRequestPayload }
  >({
    mutationFn: ({ orderId, payload }) =>
      requestCancellationApi(orderId, payload),
    onSuccess: (data, variables, context) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.list({}) }); // Hoặc list cụ thể nếu có params
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          t("requestCancelError"),
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// --- Hook: User yêu cầu hoàn tiền ---
export const useRequestRefund = (
  options?: MutationOptions<
    { message: string; order: Order },
    { orderId: string; payload: OrderRequestPayload }
  >,
) => {
  const t = useTranslations("reactQuery.order");
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; order: Order },
    AxiosError<{ message?: string }>,
    { orderId: string; payload: OrderRequestPayload }
  >({
    mutationFn: ({ orderId, payload }) => requestRefundApi(orderId, payload),
    onSuccess: (data, variables, context) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.list({}) });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          t("requestRefundError"),
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// --- Hook: User xác nhận đã nhận hàng ---
export const useMarkOrderAsDelivered = (
  options?: MutationOptions<Order, string>,
) => {
  const t = useTranslations("reactQuery.order");
  const queryClient = useQueryClient();
  return useMutation<Order, AxiosError<{ message?: string }>, string>({
    // string là orderId
    mutationFn: markOrderAsDeliveredApi,
    onSuccess: (updatedOrder, orderId, context) => {
      toast.success(t("markAsDeliveredSuccess"));
      queryClient.setQueryData(orderKeys.detail(orderId), updatedOrder);
      queryClient.invalidateQueries({ queryKey: orderKeys.list({}) });
      options?.onSuccess?.(updatedOrder, orderId, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          t("markAsDeliveredError"),
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// === Admin Hooks ===
export const useGetAllOrdersAdmin = (
  params?: GetAllOrdersAdminParams,
  options?: CustomQueryOptions<PaginatedOrdersResponse>, // Sử dụng CustomQueryOptions
) => {
  return useQuery<PaginatedOrdersResponse, AxiosError<{ message?: string }>>({
    queryKey: orderKeys.list(params || { admin: true }),
    queryFn: () => getAllOrdersAdminApi(params),
    placeholderData: (previousData) => previousData, // Giữ lại dữ liệu trước đó
    ...options,
  });
};

export const useUpdateOrderStatusAdmin = (
  options?: MutationOptions<
    Order,
    { orderId: string; payload: UpdateOrderStatusAdminPayload }
  >,
) => {
  const t = useTranslations("reactQuery.order");
  const queryClient = useQueryClient();
  return useMutation<
    Order,
    AxiosError<{ message?: string }>,
    { orderId: string; payload: UpdateOrderStatusAdminPayload }
  >({
    mutationFn: ({ orderId, payload }) =>
      updateOrderStatusAdminApi(orderId, payload),
    onSuccess: (updatedOrder, variables, context) => {
      toast.success(
        t("updateStatusSuccess", { id: variables.orderId.slice(-6) }),
      );
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() }); // Invalidate all lists for admin
      options?.onSuccess?.(updatedOrder, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          t("updateStatusError"),
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// Hooks for approve/reject cancellation/refund (Admin)
export const useApproveRequestAdmin = (
  options?: MutationOptions<
    { message: string; order: Order },
    { orderId: string; type: "cancellation" | "refund" }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; order: Order },
    AxiosError<{ message?: string }>,
    { orderId: string; type: "cancellation" | "refund" }
  >({
    mutationFn: ({ orderId, type }) => approveRequestAdminApi(orderId, type),
    onSuccess: (data, variables, context) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || error.message);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export const useRejectRequestAdmin = (
  options?: MutationOptions<
    { message: string; order: Order },
    {
      orderId: string;
      type: "cancellation" | "refund";
      payload: { reason: string };
    }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; order: Order },
    AxiosError<{ message?: string }>,
    {
      orderId: string;
      type: "cancellation" | "refund";
      payload: { reason: string };
    }
  >({
    mutationFn: ({ orderId, type, payload }) =>
      rejectRequestAdminApi(orderId, type, payload),
    onSuccess: (data, variables, context) => {
      toast.success(data.message);
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || error.message);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// Hook for restock (Admin)
export const useRestockOrderItemsAdmin = (
  options?: MutationOptions<{ message: string; order: Order }, string>,
) => {
  const t = useTranslations("reactQuery.order");
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; order: Order },
    AxiosError<{ message?: string }>,
    string
  >({
    // string is orderId
    mutationFn: restockOrderItemsAdminApi,
    onSuccess: (data, orderId, context) => {
      toast.success(data.message);
      // Invalidate product details or lists if stock changes are significant for other views
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });

      options?.onSuccess?.(data, orderId, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message || error.message || t("restockError"),
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// --- Hook: Tạo một đơn hàng trên hệ thống PayPal (chưa lưu vào DB) ---
export const useCreatePayPalOrder = () => {
  return useMutation<
    { orderID: string }, // Kiểu dữ liệu trả về từ API
    Error, // Kiểu lỗi
    { selectedCartItemIds: string[]; shippingAddress: ShippingAddressData } // Kiểu dữ liệu đầu vào (payload)
  >({
    mutationFn: createPayPalOrderApi,
  });
};

// --- Hook: Capture thanh toán PayPal và cập nhật đơn hàng trong DB ---
export const useCapturePayPalOrder = () => {
  const t = useTranslations("reactQuery.order");
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; order: Order },
    Error,
    { orderId: string; paypalOrderId: string }
  >({
    mutationFn: ({ orderId, paypalOrderId }) =>
      capturePayPalOrderApi(orderId, paypalOrderId),
    onSuccess: () => {
      // Invalidate các query liên quan để làm mới dữ liệu
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: cartKeys.cart });
      toast.success(t("capturePayPalSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("capturePayPalError"));
    },
  });
};
