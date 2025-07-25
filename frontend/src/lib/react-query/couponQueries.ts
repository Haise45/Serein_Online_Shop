import {
  createCouponApi,
  deleteCouponAdminApi,
  getAdminCouponByIdApi,
  getAdminCouponsApi,
  getCouponByIdApi,
  getCouponsApi,
  GetCouponsParams,
  updateCouponApi,
} from "@/services/couponService";
import {
  Coupon,
  CouponAdmin,
  CouponFormData,
  PaginatedAdminCouponsResponse,
  PaginatedCouponsResponse,
} from "@/types/coupon";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
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
  options?: Omit<UseQueryOptions<Coupon, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery<Coupon, Error>({
    queryKey: couponKeys.detail(id),
    queryFn: () => getCouponByIdApi(id),
    ...options, // Truyền các options từ ngoài vào
  });
};

export const useGetAdminCoupons = (params?: GetCouponsParams) => {
  return useQuery<PaginatedAdminCouponsResponse, Error>({
    queryKey: [...couponKeys.lists(), "admin", params || {}],
    queryFn: () => getAdminCouponsApi(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useGetAdminCouponById = (id: string) => {
  return useQuery<CouponAdmin, Error>({
    queryKey: couponKeys.detail(id),
    queryFn: () => getAdminCouponByIdApi(id),
    enabled: !!id,
  });
};

export const useCreateCoupon = () => {
  const t = useTranslations("reactQuery.coupon");
  const queryClient = useQueryClient();
  return useMutation<CouponAdmin, Error, Partial<CouponFormData>>({
    mutationFn: createCouponApi,
    onSuccess: (newCoupon) => {
      const message = t("createSuccess").replace("{code}", newCoupon.code);
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
    onError: (error) => {
      toast.error(error.message || t("createError"));
    },
  });
};

export const useUpdateCoupon = () => {
  const t = useTranslations("reactQuery.coupon");
  const queryClient = useQueryClient();
  return useMutation<
    CouponAdmin,
    Error,
    { id: string; payload: Partial<CouponFormData> }
  >({
    mutationFn: ({ id, payload }) => updateCouponApi(id, payload),
    onSuccess: (updatedCoupon) => {
      const message = t("updateSuccess").replace("{code}", updatedCoupon.code);
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: couponKeys.detail(updatedCoupon._id),
      });
    },
    onError: (error) => {
      toast.error(error.message || t("updateError"));
    },
  });
};

export const useDeleteCouponAdmin = () => {
  const t = useTranslations("reactQuery.coupon");
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: deleteCouponAdminApi,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
    onError: (error) => {
      toast.error(error.message || t("deleteError"));
    },
  });
};
