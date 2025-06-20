import axiosInstance from "@/lib/axiosInstance";
import {
  CreateReviewPayload,
  GetProductReviewsParams,
  PaginatedReviewsResponse,
  Review,
  UpdateReviewPayload,
} from "@/types/review";
import { AxiosError } from "axios";

const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

// Lấy review cho một sản phẩm
export const getProductReviewsApi = async (
  productId: string,
  params?: GetProductReviewsParams,
): Promise<PaginatedReviewsResponse> => {
  try {
    const { data } = await axiosInstance.get<PaginatedReviewsResponse>(
      `products/${productId}/reviews`,
      { params },
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Không thể tải danh sách đánh giá."));
  }
};

// Tạo review mới
export const createReviewApi = async (
  productId: string,
  payload: CreateReviewPayload,
): Promise<{ message: string; review: Review }> => {
  try {
    const { data } = await axiosInstance.post<{
      message: string;
      review: Review;
    }>(`products/${productId}/reviews`, payload);
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Tạo đánh giá thất bại."));
  }
};

// Lấy review của user cho một sản phẩm cụ thể (để kiểm tra đã review chưa)
export const getUserReviewForProductApi = async (
  productId: string,
): Promise<Review | null> => {
  try {
    const { data } = await axiosInstance.get<Review | null>(
      `/reviews/my-review`,
      { params: { productId } },
    );
    return data;
  } catch (err: unknown) {
    const error = err as AxiosError;
    if (error.response?.status === 404) return null;
    console.error("Lỗi khi kiểm tra đánh giá của người dùng:", error);

    return null;
  }
};

// User cập nhật review của mình
export const updateUserReviewApi = async (
  reviewId: string,
  payload: UpdateReviewPayload,
): Promise<{ message: string; review: Review }> => {
  try {
    const { data } = await axiosInstance.put<{
      message: string;
      review: Review;
    }>(`/reviews/${reviewId}`, payload);
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Cập nhật đánh giá thất bại."));
  }
};

// User xóa review của mình
export const deleteMyReviewApi = async (
  reviewId: string,
): Promise<{ message: string }> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(
      `/reviews/${reviewId}/my`,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Xóa đánh giá thất bại."));
  }
};

// --- ADMIN APIs ---

export interface GetAllReviewsAdminParams extends GetProductReviewsParams {
  productId?: string;
  userId?: string;
  isApproved?: boolean;
}

export const getAllReviewsAdminApi = async (
  params?: GetAllReviewsAdminParams,
): Promise<PaginatedReviewsResponse> => {
  try {
    const { data } = await axiosInstance.get<PaginatedReviewsResponse>(
      `reviews`,
      { params },
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Không thể tải danh sách đánh giá."));
  }
};

export const approveReviewAdminApi = async (
  reviewId: string,
): Promise<Review> => {
  const { data } = await axiosInstance.put<{ message: string; review: Review }>(
    `/reviews/${reviewId}/approve`,
  );
  return data.review;
};

export const rejectReviewAdminApi = async (
  reviewId: string,
): Promise<Review> => {
  const { data } = await axiosInstance.put<{ message: string; review: Review }>(
    `/reviews/${reviewId}/reject`,
  );
  return data.review;
};

export const deleteReviewAdminApi = async (
  reviewId: string,
): Promise<{ message: string }> => {
  const { data } = await axiosInstance.delete<{ message: string }>(
    `/reviews/${reviewId}`,
  );
  return data;
};

export const addAdminReplyApi = async (
  reviewId: string,
  payload: { comment: string },
): Promise<Review> => {
  const { data } = await axiosInstance.post<{
    message: string;
    review: Review;
  }>(`/reviews/${reviewId}/reply`, payload);
  return data.review;
};
