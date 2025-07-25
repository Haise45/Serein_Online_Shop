import { I18nField } from ".";

export type DiscountType = "percentage" | "fixed_amount";
export type CouponApplicableTo = "all" | "categories" | "products";

export interface ApplicableDetail {
  _id: string;
  name: I18nField | string;
  slug: string;
}

// --- Base Interface ---
interface BaseCoupon {
  _id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxUsage: number | null;
  usageCount: number;
  maxUsagePerUser: number;
  startDate?: Date | string | null;
  expiryDate: Date | string;
  isActive: boolean;
  applicableTo: CouponApplicableTo;
  applicableIds: string[];
  applicableDetails?: ApplicableDetail[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

// --- Dành cho Client (đã làm phẳng) ---
export interface Coupon extends BaseCoupon {
  description?: string | null;
}

export interface PaginatedCouponsResponse {
  currentPage: number;
  totalPages: number;
  totalCoupons: number;
  limit: number;
  coupons: Coupon[];
}

// --- Dành cho Admin (dữ liệu gốc) ---
export interface CouponAdmin extends BaseCoupon {
  description?: I18nField;
}
export interface PaginatedAdminCouponsResponse {
  currentPage: number;
  totalPages: number;
  totalCoupons: number;
  limit: number;
  coupons: CouponAdmin[];
}

// --- Dành cho Form ---
export interface CouponFormData {
  code: string;
  description: I18nField;
  discountType: DiscountType;
  discountValue: number | string;
  minOrderValue: number | string;
  maxUsage: number | string | null;
  maxUsagePerUser: number | string;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
  applicableTo: CouponApplicableTo;
  applicableIds: string[];
}
