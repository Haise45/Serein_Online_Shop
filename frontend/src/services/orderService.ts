import axiosInstance from "@/lib/axiosInstance";
import { OrderCreationPayload, OrderRequestPayload, ShippingAddressData } from "@/types/order";
import { Order, PaginatedOrdersResponse } from "@/types/order_model";
import { AxiosError } from "axios";

const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

// --- Tạo đơn hàng ---
export const createOrderApi = async (
  payload: OrderCreationPayload,
): Promise<Order> => {
  try {
    const { data } = await axiosInstance.post<Order>("orders", payload);
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Đặt hàng thất bại."));
  }
};

// --- Lấy danh sách đơn hàng của tôi (User) ---
export interface GetMyOrdersParams {
  page?: number;
  limit?: number;
  status?: string; // Thêm filter theo status nếu API hỗ trợ
  // Thêm các params khác nếu API hỗ trợ
}
export const getMyOrdersApi = async (
  params?: GetMyOrdersParams,
): Promise<PaginatedOrdersResponse> => {
  try {
    // API trả về cấu trúc PaginatedOrdersResponse với OrderSummary[] hoặc Order[]
    const { data } = await axiosInstance.get<PaginatedOrdersResponse>(
      "orders/my",
      { params },
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Không thể tải lịch sử đơn hàng."));
  }
};

// --- Guest theo dõi đơn hàng ---
export const getGuestOrderByTokenApi = async (
  orderId: string,
  token: string,
): Promise<Order> => {
  console.log(
    "[Service] getGuestOrderByTokenApi called with orderId:",
    orderId,
    "token:",
    token,
  ); // DEBUG
  if (!orderId || !token) {
    // Kiểm tra lại ở đây cho chắc chắn
    console.error(
      "[Service] getGuestOrderByTokenApi: Missing orderId or token.",
    );
    throw new Error("Missing orderId or token in API call.");
  }
  try {
    const url = `orders/guest-track/${orderId}/${token}`;
    console.log("[Service] Calling URL:", url); // DEBUG URL
    const { data } = await axiosInstance.get<Order>(url);
    return data;
  } catch (err: unknown) {
    const error = err as AxiosError<{ message?: string }>;
    console.error(
      `[Service] Error fetching guest order ${orderId}/${token}:`,
      error.response?.status,
      error.response?.data || error.message,
    ); // Log chi tiết lỗi
    throw new Error(
      getErrorMessage(
        err,
        "Không thể tìm thấy thông tin đơn hàng hoặc link theo dõi không hợp lệ.",
      ),
    );
  }
};

// --- Lấy chi tiết đơn hàng (User đã login hoặc Admin) ---
export const getOrderByIdApi = async (orderId: string): Promise<Order> => {
  try {
    const { data } = await axiosInstance.get<Order>(`orders/${orderId}`);
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Không thể tải chi tiết đơn hàng."));
  }
};

// --- User yêu cầu hủy đơn hàng ---
export const requestCancellationApi = async (
  orderId: string,
  payload: OrderRequestPayload,
): Promise<{ message: string; order: Order }> => {
  try {
    const { data } = await axiosInstance.put<{ message: string; order: Order }>(
      `orders/${orderId}/request-cancellation`,
      payload,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Gửi yêu cầu hủy đơn thất bại."));
  }
};

// --- User yêu cầu hoàn tiền ---
export const requestRefundApi = async (
  orderId: string,
  payload: OrderRequestPayload,
): Promise<{ message: string; order: Order }> => {
  try {
    const { data } = await axiosInstance.put<{ message: string; order: Order }>(
      `orders/${orderId}/request-refund`,
      payload,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Gửi yêu cầu hoàn tiền thất bại."));
  }
};

// --- User xác nhận đã nhận hàng ---
export const markOrderAsDeliveredApi = async (
  orderId: string,
): Promise<Order> => {
  try {
    const { data } = await axiosInstance.put<Order>(
      `orders/${orderId}/deliver`,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Xác nhận đã nhận hàng thất bại."));
  }
};

// === Admin: Order Management ===
export interface GetAllOrdersAdminParams extends GetMyOrdersParams {
  userId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
export const getAllOrdersAdminApi = async (
  params?: GetAllOrdersAdminParams,
): Promise<PaginatedOrdersResponse> => {
  try {
    const { data } = await axiosInstance.get<PaginatedOrdersResponse>(
      "orders",
      { params },
    ); // Endpoint GET /orders của Admin
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(err, "Không thể tải danh sách đơn hàng (Admin)."),
    );
  }
};

export interface UpdateOrderStatusAdminPayload {
  status: "Processing" | "Shipped" | "Cancelled" | "Refunded"; // Các trạng thái Admin có thể set
}
export const updateOrderStatusAdminApi = async (
  orderId: string,
  payload: UpdateOrderStatusAdminPayload,
): Promise<Order> => {
  try {
    const { data } = await axiosInstance.put<Order>(
      `orders/${orderId}/status`,
      payload,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(err, "Cập nhật trạng thái đơn hàng thất bại (Admin)."),
    );
  }
};

// Các hàm Admin khác (approve/reject cancellation/refund, restock)
export const approveRequestAdminApi = async (
  orderId: string,
  type: "cancellation" | "refund",
): Promise<{ message: string; order: Order }> => {
  try {
    const { data } = await axiosInstance.put<{ message: string; order: Order }>(
      `orders/${orderId}/approve-${type}`,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(
        err,
        `Chấp nhận yêu cầu ${type === "cancellation" ? "hủy" : "hoàn tiền"} thất bại.`,
      ),
    );
  }
};

export const rejectRequestAdminApi = async (
  orderId: string,
  type: "cancellation" | "refund",
  payload: { reason: string },
): Promise<{ message: string; order: Order }> => {
  try {
    const { data } = await axiosInstance.put<{ message: string; order: Order }>(
      `orders/${orderId}/reject-${type}`,
      payload,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(
        err,
        `Từ chối yêu cầu ${type === "cancellation" ? "hủy" : "hoàn tiền"} thất bại.`,
      ),
    );
  }
};

export const restockOrderItemsAdminApi = async (
  orderId: string,
): Promise<{ message: string; order: Order }> => {
  try {
    const { data } = await axiosInstance.post<{
      message: string;
      order: Order;
    }>(`orders/${orderId}/restock`);
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Khôi phục tồn kho thất bại."));
  }
};

export const createPayPalOrderApi = async (payload: {
  selectedCartItemIds: string[];
  shippingAddress: ShippingAddressData;
}): Promise<{ orderID: string }> => {
  const { data } = await axiosInstance.post<{ orderID: string }>(
    "/orders/create-paypal-order",
    payload,
  );
  return data;
};

export const capturePayPalOrderApi = async (
  orderId: string,
  paypalOrderId: string,
): Promise<{ message: string; order: Order }> => {
  const { data } = await axiosInstance.post<{ message: string; order: Order }>(
    `/orders/${orderId}/capture-paypal`,
    { paypalOrderId },
  );
  return data;
};
