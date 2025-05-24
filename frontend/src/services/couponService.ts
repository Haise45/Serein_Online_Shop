import axiosInstance from "@/lib/axiosInstance";
import { Coupon } from "@/types/coupon";

interface GetCouponsParams {
  validNow?: boolean;
  isActive?: boolean;
  // Thêm các params filter khác nếu cần cho trang giỏ hàng
  // Ví dụ: có thể gửi subtotal của giỏ hàng để backend lọc coupon theo minOrderValue
}
interface PaginatedCoupons {
  coupons: Coupon[];
}

// Lấy các coupon khả dụng cho giỏ hàng
export const getApplicableCoupons = async (
  params?: GetCouponsParams,
): Promise<Coupon[]> => {
  // Gọi API GET /api/v1/coupons với params
  // API getCoupons của bạn trả về object có key là 'coupons'
  const { data } = await axiosInstance.get<PaginatedCoupons>("api/coupons", {
    params,
  });
  return data.coupons;
};
