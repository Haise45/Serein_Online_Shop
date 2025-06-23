import { Coupon } from "./coupon";
import { Product, VariantOptionValue } from "./product";

export interface CartItem {
  _id: string;
  productId: Product | string;
  variantId?: string | null;
  name: string;
  slug: string;
  sku: string;
  price: number; // Đây là displayPrice (giá cuối cùng) của item
  originalPrice: number; // Giá gốc của item, để hiển thị gạch ngang
  isOnSale: boolean; // Cờ cho biết item có đang giảm giá không
  quantity: number;
  lineTotal: number; // price * quantity
  image?: string | null;
  availableStock: number;
  category?: {
    name: string;
    slug: string;
    _id: string;
    parent?: string | null;
  }; // Thêm parent
  variantInfo?: {
    _id: string;
    sku?: string;
    options: VariantOptionValue[];
  } | null;
}

export interface AppliedCouponInfo extends Partial<Coupon> {
  error?: string; // Thông báo lỗi nếu coupon không còn hợp lệ khi re-validate
  discountAmount?: number; // Thêm trường này để biết chính xác số tiền được giảm
}

export interface CartData {
  _id?: string; // ID của document Cart
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
  totalDistinctItems: number;
  appliedCoupon?: AppliedCouponInfo | null;
  discountAmount: number;
  shippingFee?: number;
  finalTotal: number;
  userId?: string;
  guestId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartPayload {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity?: number;
  newVariantId?: string | null;
}
