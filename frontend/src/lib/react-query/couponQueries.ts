import { getApplicableCoupons as getApplicableCouponsApi } from "@/services/couponService";
import { Coupon } from "@/types/coupon";
import { useQuery } from "@tanstack/react-query";

export const couponKeys = {
  applicable: (params?: unknown) => ["coupons", "applicable", params] as const,
};

export const useGetApplicableCoupons = (params?: {
  validNow?: boolean;
  isActive?: boolean;
}) => {
  return useQuery<Coupon[], Error>({
    queryKey: couponKeys.applicable(params),
    queryFn: () => getApplicableCouponsApi(params),
    // staleTime: 1000 * 60 * 5, // Cache coupons
  });
};
