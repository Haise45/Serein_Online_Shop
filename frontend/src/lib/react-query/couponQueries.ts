import {
  createCouponApi,
  deleteCouponAdminApi,
  getCouponByIdApi,
  getCouponsApi,
  GetCouponsParams,
  updateCouponApi,
} from "@/services/couponService";
import {
  Coupon,
  CouponFormData,
  PaginatedCouponsResponse,
} from "@/types/coupon";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

export const couponKeys = {
  all: ["coupons"] as const,
  lists: () => [...couponKeys.all, "list"] as const,
  list: (params?: GetCouponsParams) =>
    [...couponKeys.lists(), params || {}] as const,
  details: () => [...couponKeys.all, "detail"] as const,
  detail: (id: string) => [...couponKeys.details(), id] as const,
};

type CustomCouponQueryOptions = Omit<
  UseQueryOptions<PaginatedCouponsResponse, AxiosError<{ message?: string }>>,
  "queryKey" | "queryFn"
>;

// Hook chính để lấy danh sách coupon, có thể dùng cho nhiều mục đích
export const useGetCoupons = (
  params?: GetCouponsParams,
  options?: CustomCouponQueryOptions,
) => {
  return useQuery<PaginatedCouponsResponse, AxiosError<{ message?: string }>>({
    queryKey: couponKeys.list(params),
    queryFn: () => getCouponsApi(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

export const useGetCouponById = (
  id: string,
  // Thêm tham số options (optional)
  options?: Omit<UseQueryOptions<Coupon, Error>, 'queryKey' | 'queryFn'>
) => {
    return useQuery<Coupon, Error>({
        queryKey: couponKeys.detail(id),
        queryFn: () => getCouponByIdApi(id),
        ...options, // Truyền các options từ ngoài vào
    });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation<Coupon, Error, Partial<CouponFormData>>({
    mutationFn: createCouponApi,
    onSuccess: (newCoupon) => {
      toast.success(`Đã tạo mã giảm giá "${newCoupon.code}" thành công!`);
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
    onError: (error) => {
      toast.error(error.message || "Tạo mã giảm giá thất bại.");
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Coupon,
    Error,
    { id: string; payload: Partial<CouponFormData> }
  >({
    mutationFn: ({ id, payload }) => updateCouponApi(id, payload),
    onSuccess: (updatedCoupon) => {
      toast.success(`Đã cập nhật mã giảm giá "${updatedCoupon.code}"!`);
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: couponKeys.detail(updatedCoupon._id),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Cập nhật thất bại.");
    },
  });
};

export const useDeleteCouponAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: deleteCouponAdminApi,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
    onError: (error) => {
      toast.error(error.message || "Vô hiệu hóa thất bại.");
    },
  });
};
