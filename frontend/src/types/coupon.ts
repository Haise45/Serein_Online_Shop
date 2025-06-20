export type DiscountType = "percentage" | "fixed_amount";
export type CouponApplicableTo = "all" | "categories" | "products";

export interface ApplicableDetail {
  _id: string;
  name: string;
  slug: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxUsage?: number | null; // null nghĩa là không giới hạn
  usageCount: number;
  maxUsagePerUser: number;
  startDate?: Date | string | null; // API có thể trả về string, client có thể convert sang Date
  expiryDate: Date | string; // Tương tự, API có thể trả về string
  isActive: boolean;
  applicableTo: CouponApplicableTo;
  applicableIds: string[]; // Mảng các ObjectId dưới dạng string
  applicableDetails?: ApplicableDetail[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaginatedCouponsResponse {
  currentPage: number;
  totalPages: number;
  totalCoupons: number;
  limit: number;
  coupons: Coupon[];
}

// Dùng cho cả tạo mới và cập nhật
export interface CouponFormData {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number | string; // Cho phép string để form dễ xử lý
  minOrderValue: number | string;
  maxUsage: number | string | null;
  maxUsagePerUser: number | string;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  applicableTo: CouponApplicableTo;
  applicableIds: string[];
}
