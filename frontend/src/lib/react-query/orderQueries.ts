import {
  approveRequestAdminApi,
  createOrderApi,
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
import { OrderCreationPayload, OrderRequestPayload } from "@/types/order";
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
  const queryClient = useQueryClient();
  return useMutation<
    Order,
    AxiosError<{ message?: string }>,
    OrderCreationPayload
  >({
    mutationFn: createOrderApi,
    onSuccess: (newOrder, variables, context) => {
      toast.success(
        `Đặt hàng thành công! Mã đơn hàng: #${newOrder._id.toString().slice(-6)}`,
      );
      queryClient.invalidateQueries({ queryKey: cartKeys.cart });
      queryClient.invalidateQueries({ queryKey: orderKeys.list({}) }); // Invalidate list chung
      options?.onSuccess?.(newOrder, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message || error.message || "Đặt hàng thất bại.",
      );
      options?.onError?.(error, variables, context);
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
          "Gửi yêu cầu hủy thất bại.",
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
          "Gửi yêu cầu hoàn tiền thất bại.",
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
  const queryClient = useQueryClient();
  return useMutation<Order, AxiosError<{ message?: string }>, string>({
    // string là orderId
    mutationFn: markOrderAsDeliveredApi,
    onSuccess: (updatedOrder, orderId, context) => {
      toast.success("Đã xác nhận nhận hàng!");
      queryClient.setQueryData(orderKeys.detail(orderId), updatedOrder);
      queryClient.invalidateQueries({ queryKey: orderKeys.list({}) });
      options?.onSuccess?.(updatedOrder, orderId, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Xác nhận nhận hàng thất bại.",
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
        `Cập nhật trạng thái đơn hàng #${variables.orderId.slice(-6)} thành công.`,
      );
      queryClient.setQueryData(
        orderKeys.detail(variables.orderId),
        updatedOrder,
      );
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() }); // Invalidate all lists for admin
      options?.onSuccess?.(updatedOrder, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Cập nhật trạng thái thất bại.",
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
      queryClient.setQueryData(orderKeys.detail(variables.orderId), data.order);
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
      queryClient.setQueryData(orderKeys.detail(variables.orderId), data.order);
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
  options?: MutationOptions<{ message: string }, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    AxiosError<{ message?: string }>,
    string
  >({
    // string is orderId
    mutationFn: restockOrderItemsAdminApi,
    onSuccess: (data, orderId, context) => {
      toast.success(data.message);
      // Invalidate product details or lists if stock changes are significant for other views
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Broad invalidation
      options?.onSuccess?.(data, orderId, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Khôi phục tồn kho thất bại.",
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
