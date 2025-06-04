import { Product } from "./product";
import { User } from "./user";

export interface AdminReply {
  user: Pick<User, "_id" | "name">;
  comment: string;
  createdAt: string | Date;
}

export interface Review {
  _id: string;
  user: Pick<User, "_id" | "name">;
  product: Pick<Product, "_id" | "name" | "slug" | "images"> | string;
  comment?: string;
  rating: number;
  userImages?: string[];
  isApproved: boolean;
  approvedAt?: string | Date | null;
  approvedBy?: Pick<User, "_id" | "name"> | null;
  adminReply?: AdminReply | null;
  isEdited?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginatedReviewsResponse {
  currentPage: number;
  totalPages: number;
  totalReviews: number;
  limit: number;
  averageRating?: number;
  reviews: Review[];
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
  orderId: string;
  userImages?: string[];
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
  userImages?: string[];
}

export interface GetProductReviewsParams {
  page?: number;
  limit?: number;
  rating?: number;
  sorfBy?: string;
  sorfOrder?: "asc" | "desc";
  hasUserImages?: boolean;
}
