import axiosInstance from "@/lib/axiosInstance";
import { PaginatedCouponsResponse } from "@/types/coupon";
import { AxiosError } from "axios";

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
