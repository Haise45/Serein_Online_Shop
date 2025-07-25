import { Product, VariantOptionValue } from "./product";
import { User } from "./user";

// Dựa trên shippingAddressSchema
export interface OrderShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  communeCode: string;
  communeName: string;
  districtCode: string;
  districtName: string;
  provinceCode: string;
  provinceName: string;
  countryCode?: string;
}

// Dựa trên orderItemVariantSchema
export interface OrderItemVariantInfo {
  variantId: string; // ID của variant gốc
  sku?: string | null;
  options: VariantOptionValue[];
}

// Dựa trên orderItemSchema
export interface OrderItem {
  _id: string; // ID của OrderItem
  name: string; // Tên sản phẩm snapshot
  quantity: number;
  price: number; // Giá đơn vị snapshot
  image?: string | null; // Ảnh snapshot
  product: string | Product; // ID sản phẩm gốc, hoặc Product đã populate
  variant?: OrderItemVariantInfo | null;
}

// Dựa trên requestSchema
export interface OrderRequestInfo {
  reason: string;
  imageUrls?: string[];
  requestedAt: string | Date;
}

export interface PaymentResult {
  id: string;
  status: string;
  update_time: string;
  email_address: string;
  captureId: string;
}

// Dựa trên orderSchema
export interface Order {
  _id: string;
  user?: User | string | null; // Có thể là User object đã populate, hoặc ID, hoặc null cho guest
  guestOrderEmail?: string | null;
  guestSessionId?: string | null;
  guestOrderTrackingToken?: string | null;
  guestOrderTrackingTokenExpires?: string | Date | null;
  orderItems: OrderItem[];
  shippingAddress: OrderShippingAddress;
  paymentMethod: "COD" | "BANK_TRANSFER" | "PAYPAL" | string; // String nếu có thể có phương thức khác
  paymentResult?: PaymentResult | null;
  shippingMethod?: string;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  discountAmount: number;
  totalPrice: number;
  appliedCouponCode?: string | null;
  status:
    | "Pending"
    | "Processing"
    | "Shipped"
    | "Delivered"
    | "Cancelled"
    | "Refunded"
    | "CancellationRequested"
    | "RefundRequested"
    | string;
  previousStatus?: "Pending" | "Processing" | "Shipped" | "Delivered" | null;
  cancellationRequest?: OrderRequestInfo | null;
  refundRequest?: OrderRequestInfo | null;
  adminNotes?: string | null;
  notes?: string | null;
  isPaid: boolean;
  paidAt?: string | Date | null;
  isDelivered: boolean;
  deliveredAt?: string | Date | null;
  isStockRestored?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Cho danh sách đơn hàng (có thể chỉ lấy một số trường)
export interface OrderSummary {
  _id: string;
  status: string;
  totalPrice: number;
  createdAt: string | Date;
  deliveredAt: string | Date;
  orderItems: OrderItem[]; // Chỉ lấy một phần của orderItems

  // Thêm các trường đã được populate từ API
  user?: Pick<User, "_id" | "name" | "email" | "phone"> | null;
  guestOrderEmail?: string | null;
  isPaid: boolean;
  paidAt?: string | Date | null;

  // Thêm shippingAddress.fullName để hiển thị tên guest
  shippingAddress: Pick<OrderShippingAddress, "fullName">;
  isStockRestored?: boolean;
}

export interface PaginatedOrdersResponse {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  limit: number;
  orders: OrderSummary[];
}
