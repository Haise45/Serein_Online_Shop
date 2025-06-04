import {
  createReviewApi,
  deleteMyReviewApi,
  getProductReviewsApi,
  getUserReviewForProductApi,
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
import toast from "react-hot-toast";
import { productKeys } from "./productQueries";

export const reviewKeys = {
  all: ["reviews"] as const,
  lists: () => [...reviewKeys.all, "list"] as const,
  list: (productId: string, params: GetProductReviewsParams) =>
    [...reviewKeys.lists(), productId, params ?? {}] as const,
  detail: (reviewId: string) =>
    [...reviewKeys.all, "detail", reviewId] as const,
  userReviewForProduct: (productId: string, userId?: string) =>
    [...reviewKeys.all, "userSpecific", productId, userId || "guest"] as const,
};

type MutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<
    TData,
    AxiosError<{ message?: string }>,
    TVariables,
    unknown
  >,
  "mutationFn"
>;

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
    queryKey: reviewKeys.list(productId!, params || {}), // Dùng ! vì đã có enabled
    queryFn: () => getProductReviewsApi(productId!, params),
    enabled: !!productId,
    placeholderData: (previousData) => previousData,
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
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; review: Review },
    AxiosError<{ message?: string }>,
    { productId: string; payload: CreateReviewPayload }
  >({
    mutationFn: ({ productId, payload }) => createReviewApi(productId, payload),
    onSuccess: (data, variables, context) => {
      toast.success(
        data.message || "Đánh giá của bạn đã được gửi và đang chờ duyệt!",
      );
      // Invalidate danh sách review của sản phẩm đó để hiển thị review mới (nếu được duyệt ngay)
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list(variables.productId, {}),
      });
      // Invalidate query chi tiết sản phẩm để cập nhật averageRating và numReviews
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      // (Tùy chọn) Invalidate query lấy review của user cho sản phẩm này
      queryClient.invalidateQueries({
        queryKey: reviewKeys.userReviewForProduct(variables.productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Gửi đánh giá thất bại.",
      );
      options?.onError?.(error, variables, context);
    },
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
  // Giả sử userId được lấy từ Redux store hoặc context ở component sử dụng
  // Nếu không, bạn cần truyền userId vào đây
  // const { user } = useSelector((state: RootState) => state.auth);
  return useQuery<Review | null, AxiosError<{ message?: string }>>({
    queryKey: reviewKeys.userReviewForProduct(productId!), // Thêm userId nếu API cần
    queryFn: () => getUserReviewForProductApi(productId!),
    enabled: !!productId, // Chỉ fetch khi có productId
    staleTime: 1000 * 60 * 5, // Cache 5 phút
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
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; review: Review },
    AxiosError<{ message?: string }>,
    { reviewId: string; payload: UpdateReviewPayload }
  >({
    mutationFn: ({ reviewId, payload }) =>
      updateUserReviewApi(reviewId, payload),
    onSuccess: (data, variables, context) => {
      toast.success(
        data.message ||
          "Đánh giá của bạn đã được cập nhật và đang chờ duyệt lại.",
      );
      // Invalidate review chi tiết (nếu có trang xem chi tiết review)
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(variables.reviewId),
      });
      // Invalidate danh sách review của sản phẩm đó
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list(data.review.product.toString(), {}),
      });
      // Invalidate query chi tiết sản phẩm để cập nhật averageRating
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(data.review.product.toString()),
      });
      // Invalidate query lấy review của user cho sản phẩm này
      queryClient.invalidateQueries({
        queryKey: reviewKeys.userReviewForProduct(
          data.review.product.toString(),
        ),
      });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Cập nhật đánh giá thất bại.",
      );
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
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    AxiosError<{ message?: string }>,
    { reviewId: string; productId: string }
  >({
    mutationFn: ({ reviewId }) => deleteMyReviewApi(reviewId),
    onSuccess: (data, variables, context) => {
      toast.success(data.message || "Đánh giá đã được xóa.");
      // Invalidate danh sách review của sản phẩm đó
      queryClient.invalidateQueries({
        queryKey: reviewKeys.list(variables.productId, {}),
      });
      // Invalidate query chi tiết sản phẩm để cập nhật averageRating
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.productId),
      });
      // Invalidate query lấy review của user cho sản phẩm này
      queryClient.invalidateQueries({
        queryKey: reviewKeys.userReviewForProduct(variables.productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Xóa đánh giá thất bại.",
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
