import {
  addAdminReplyApi,
  approveReviewAdminApi,
  createReviewApi,
  deleteMyReviewApi,
  deleteReviewAdminApi,
  getAllReviewsAdminApi,
  GetAllReviewsAdminParams,
  getProductReviewsApi,
  getUserReviewForProductApi,
  rejectReviewAdminApi,
  updateUserReviewApi,
} from "@/services/reviewService";
import {
  CreateReviewPayload,
  GetProductReviewsParams,
  PaginatedReviewsResponse,
  Review,
  UpdateReviewPayload,
} from "@/types/review";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { productKeys } from "./productQueries";

// --- Query Keys ---
export const reviewKeys = {
  all: ["reviews"] as const,

  // Keys cho danh sách review của một sản phẩm cụ thể
  productLists: () => [...reviewKeys.all, "product-list"] as const,
  productList: (productId: string, params: GetProductReviewsParams) =>
    [...reviewKeys.productLists(), productId, params ?? {}] as const,

  // Keys cho danh sách review của trang Admin
  adminLists: () => [...reviewKeys.all, "admin-list"] as const,
  adminList: (params: GetAllReviewsAdminParams) =>
    [...reviewKeys.adminLists(), params] as const,

  // Key cho chi tiết một review
  details: () => [...reviewKeys.all, "detail"] as const,
  detail: (reviewId: string) => [...reviewKeys.details(), reviewId] as const,

  // Key cho review cụ thể của một user cho một sản phẩm
  userReviewForProduct: (productId: string, userId?: string) =>
    [...reviewKeys.all, "userSpecific", productId, userId || "guest"] as const,
};

// --- Type Helpers ---
type MutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<
    TData,
    AxiosError<{ message?: string }>,
    TVariables,
    unknown
  >,
  "mutationFn"
>;

// --- USER HOOKS ---

// Hook lấy reviews của một sản phẩm
export const useGetProductReviews = (
  productId: string | undefined,
  params?: GetProductReviewsParams,
  options?: Omit<
    UseQueryOptions<PaginatedReviewsResponse, AxiosError<{ message?: string }>>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<PaginatedReviewsResponse, AxiosError<{ message?: string }>>({
    queryKey: reviewKeys.productList(productId!, params || {}),
    queryFn: () => getProductReviewsApi(productId!, params),
    enabled: !!productId,
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

// Hook kiểm tra user đã review sản phẩm này chưa
export const useGetUserReviewForProduct = (
  productId: string | undefined,
  options?: Omit<
    UseQueryOptions<Review | null, AxiosError<{ message?: string }>>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<Review | null, AxiosError<{ message?: string }>>({
    queryKey: reviewKeys.userReviewForProduct(productId!),
    queryFn: () => getUserReviewForProductApi(productId!),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

// Hook tạo review mới
export const useCreateReview = (
  options?: MutationOptions<
    { message: string; review: Review },
    { productId: string; payload: CreateReviewPayload }
  >,
) => {
  const t = useTranslations("reactQuery.review");
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; review: Review },
    AxiosError<{ message?: string }>,
    { productId: string; payload: CreateReviewPayload }
  >({
    mutationFn: ({ productId, payload }) => createReviewApi(productId, payload),
    onSuccess: (data, variables, context) => {
      toast.success(data.message || t("createSuccess"));
      // Invalidate các query liên quan
      queryClient.invalidateQueries({ queryKey: reviewKeys.productLists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.userReviewForProduct(variables.productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || t("createError"));
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// Hook cập nhật review
export const useUpdateReview = (
  options?: MutationOptions<
    { message: string; review: Review },
    { reviewId: string; payload: UpdateReviewPayload }
  >,
) => {
  const t = useTranslations("reactQuery.review");
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; review: Review },
    AxiosError<{ message?: string }>,
    { reviewId: string; payload: UpdateReviewPayload }
  >({
    mutationFn: ({ reviewId, payload }) =>
      updateUserReviewApi(reviewId, payload),
    onSuccess: (data, variables, context) => {
      toast.success(data.message || t("updateSuccess"));
      const productId =
        typeof data.review.product === "string"
          ? data.review.product
          : data.review.product._id;
      // Invalidate các query liên quan
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(variables.reviewId),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.productLists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.userReviewForProduct(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || t("updateError"));
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// Hook xóa review
export const useDeleteReview = (
  options?: MutationOptions<
    { message: string },
    { reviewId: string; productId: string }
  >,
) => {
  const t = useTranslations("reactQuery.review");
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    AxiosError<{ message?: string }>,
    { reviewId: string; productId: string }
  >({
    mutationFn: ({ reviewId }) => deleteMyReviewApi(reviewId),
    onSuccess: (data, variables, context) => {
      toast.success(data.message || t("deleteSuccess"));
      // Invalidate các query liên quan
      queryClient.invalidateQueries({ queryKey: reviewKeys.productLists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.userReviewForProduct(variables.productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || t("deleteError"));
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// --- ADMIN HOOKS ---

export const useGetAllReviewsAdmin = (params?: GetAllReviewsAdminParams) => {
  return useQuery<PaginatedReviewsResponse, Error>({
    queryKey: reviewKeys.adminList(params || {}),
    queryFn: () => getAllReviewsAdminApi(params),
    placeholderData: (prev) => prev,
  });
};

// Helper để invalidate các query liên quan khi admin thực hiện hành động
const useAdminReviewMutationInvalidation = () => {
  const queryClient = useQueryClient();
  return (review: Review) => {
    // Invalidate list chung của admin để cập nhật bảng
    queryClient.invalidateQueries({ queryKey: reviewKeys.adminLists() });

    // Invalidate các query khác nếu có thông tin sản phẩm
    const productId =
      review && review.product && typeof review.product === "object"
        ? review.product._id
        : null;
    if (productId) {
      queryClient.invalidateQueries({ queryKey: reviewKeys.productLists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
    }
  };
};

export const useApproveReviewAdmin = () => {
  const t = useTranslations("reactQuery.review");
  const invalidate = useAdminReviewMutationInvalidation();
  return useMutation<Review, Error, string>({
    // string là reviewId
    mutationFn: approveReviewAdminApi,
    onSuccess: (updatedReview) => {
      toast.success(t("approveSuccess"));
      invalidate(updatedReview);
    },
    onError: (error) => toast.error(error.message || t("approveError")),
  });
};

export const useRejectReviewAdmin = () => {
  const t = useTranslations("reactQuery.review");
  const invalidate = useAdminReviewMutationInvalidation();
  return useMutation<Review, Error, string>({
    // string là reviewId
    mutationFn: rejectReviewAdminApi,
    onSuccess: (updatedReview) => {
      toast.success(t("rejectSuccess"));
      invalidate(updatedReview);
    },
    onError: (error) => toast.error(error.message || t("rejectError")),
  });
};

export const useDeleteReviewAdmin = () => {
  const t = useTranslations("reactQuery.review");
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    // string là reviewId
    mutationFn: deleteReviewAdminApi,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: reviewKeys.adminLists() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.productLists() });
    },
    onError: (error) => toast.error(error.message || t("deleteAdminError")),
  });
};

export const useAddAdminReply = () => {
  const t = useTranslations("reactQuery.review");
  const invalidate = useAdminReviewMutationInvalidation();
  return useMutation<
    Review,
    Error,
    { reviewId: string; payload: { comment: string } }
  >({
    mutationFn: ({ reviewId, payload }) => addAdminReplyApi(reviewId, payload),
    onSuccess: (updatedReview) => {
      toast.success(t("replySuccess"));
      invalidate(updatedReview);
    },
    onError: (error) => toast.error(error.message || t("replyError")),
  });
};
