export type DiscountType = "percentage" | "fixed_amount";
export type CouponApplicableTo = "all" | "categories" | "products";

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
  createdAt: Date | string;
  updatedAt: Date | string;
}
