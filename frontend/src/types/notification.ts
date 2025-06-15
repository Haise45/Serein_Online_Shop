import { Order } from "./order_model";
import { Product } from "./product";
import { User } from "./user";

// Metadata nên chi tiết hơn để client có thể render đúng
export interface NotificationMetadata {
  userId?: Pick<User, "_id" | "name" | "email"> | string | null;
  orderId?: Pick<Order, "_id" | "status" | "totalPrice"> | string | null;
  productId?: Pick<Product, "_id" | "name" | "slug"> | string | null;
  reviewId?: string | null;
  // Thêm các trường khác nếu cần
}

export type NotificationType =
  | "NEW_USER_REGISTERED"
  | "NEW_ORDER_PLACED"
  | "ORDER_STATUS_SHIPPED"
  | "ORDER_STATUS_DELIVERED"
  | "ORDER_CANCELLATION_REQUESTED"
  | "ORDER_REFUND_REQUESTED"
  | "ORDER_CANCELLATION_APPROVED"
  | "ORDER_CANCELLATION_REJECTED"
  | "ORDER_REFUND_APPROVED"
  | "ORDER_REFUND_REJECTED"
  | "PRODUCT_LOW_STOCK"
  | "PRODUCT_OUT_OF_STOCK"
  | "NEW_REVIEW_SUBMITTED"
  | "REVIEW_APPROVED";
// Thêm các type khác nếu có

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  isRead: boolean;
  recipientType: "ADMIN" | "CUSTOMER"; // Hiện tại chỉ tập trung vào ADMIN
  metadata: NotificationMetadata; // Sử dụng type chi tiết hơn
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginatedNotificationsResponse {
  currentPage: number;
  totalPages: number;
  totalNotifications: number; // Tổng số noti khớp filter (có thể là tất cả hoặc chưa đọc)
  limit: number;
  notifications: Notification[];
}
