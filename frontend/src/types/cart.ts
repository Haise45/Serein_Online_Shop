// src/types/cart.ts
import { Product } from "./product"; // Giả sử bạn có type Product và Variant

export interface CartItemOption {
  attributeName: string;
  value: string;
}

export interface CartItem {
  _id: string; // ID của cart item
  productId: Product | string; // Có thể là object Product đã populate hoặc chỉ ID
  variantId?: string | null; // ID của variant subdocument
  name: string;
  slug: string;
  sku: string;
  price: number; // Giá của 1 item tại thời điểm trong giỏ
  quantity: number;
  lineTotal: number;
  image?: string | null;
  availableStock: number;
  category?: { name: string; slug: string; _id: string } | null;
  variantInfo?: {
    _id: string;
    options: CartItemOption[];
  } | null;
}

export interface AppliedCouponInfo {
  code: string;
  discountType?: "percentage" | "fixed_amount";
  discountValue?: number;
  discountAmount: number; // Số tiền giảm giá thực tế
  error?: string; // Thông báo lỗi nếu coupon không hợp lệ khi re-validate
}

export interface CartData {
  _id?: string; // ID của document Cart
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
  appliedCoupon?: AppliedCouponInfo | null;
  discountAmount: number;
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
  quantity: number;
}
