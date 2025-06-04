import { getCouponsApi, GetCouponsParams } from "@/services/couponService";
import { PaginatedCouponsResponse } from "@/types/coupon";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const couponKeys = {
  all: ["coupons"] as const,
  lists: () => [...couponKeys.all, "list"] as const,
  list: (params?: GetCouponsParams) =>
    [...couponKeys.lists(), params || {}] as const,
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
