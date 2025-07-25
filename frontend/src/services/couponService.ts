import axiosInstance from "@/lib/axiosInstance";
import { AxiosError } from "axios";
import {
  Coupon,
  CouponAdmin,
  CouponFormData,
  PaginatedAdminCouponsResponse,
  PaginatedCouponsResponse,
} from "@/types/coupon";

const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

// Định nghĩa các tham số có thể có cho API GET /coupons
export interface GetCouponsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  code?: string;
  isActive?: boolean;
  discountType?: "percentage" | "fixed_amount";
  expired?: boolean;
  validNow?: boolean;
  // Thêm các params khác nếu API backend hỗ trợ
  applicableTo?: "all" | "products" | "categories";
  applicableId?: string;
}

// Hàm lấy danh sách coupon (có thể dùng cho cả admin và client với params phù hợp)
// API backend GET /api/v1/coupons của bạn trả về PaginatedCouponsResponse
// Client APIs
export const getCouponsApi = async (
  params?: GetCouponsParams,
): Promise<PaginatedCouponsResponse> => {
  try {
    const { data } = await axiosInstance.get<PaginatedCouponsResponse>(
      "/coupons",
      {
        // Endpoint /coupons
        params,
      },
    );
    return data; // Trả về toàn bộ object PaginatedCouponsResponse
  } catch (err: unknown) {
    console.error("Lỗi khi lấy danh sách coupon:", err);
    throw new Error(
      getErrorMessage(err, "Không thể tải danh sách mã giảm giá."),
    );
  }
};

export const getCouponByIdApi = async (id: string): Promise<Coupon> => {
  const { data } = await axiosInstance.get<Coupon>(`code/coupons/${id}`);
  return data;
};

// Admin APIs
export const getAdminCouponsApi = async (
  params?: GetCouponsParams,
): Promise<PaginatedAdminCouponsResponse> => {
  const { data } = await axiosInstance.get("/coupons/admin", { params });
  return data;
};

export const getAdminCouponByIdApi = async (
  id: string,
): Promise<CouponAdmin> => {
  const { data } = await axiosInstance.get(`/coupons/admin/${id}`);
  return data;
};

export const createCouponApi = async (
  payload: Partial<CouponFormData>,
): Promise<CouponAdmin> => {
  const { data } = await axiosInstance.post<CouponAdmin>("/coupons", payload);
  return data;
};

export const updateCouponApi = async (
  id: string,
  payload: Partial<CouponFormData>,
): Promise<CouponAdmin> => {
  const { data } = await axiosInstance.put<CouponAdmin>(`/coupons/${id}`, payload);
  return data;
};

// Đổi tên để rõ ràng hơn là cho Admin
export const deleteCouponAdminApi = async (
  id: string,
): Promise<{ message: string }> => {
  const { data } = await axiosInstance.delete<{ message: string }>(
    `/coupons/${id}`,
  );
  return data;
};
