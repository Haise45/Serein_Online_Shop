import {
  addItemToCart as addItemToCartApi,
  clearCart as clearCartApi,
  getCart as getCartApi,
  removeCartItem as removeCartItemApi,
  updateCartItem as updateCartItemApi,
  applyCoupon as applyCouponApi,
  removeCoupon as removeCouponApi,
} from "@/services/cartService"; // Giả sử bạn đã tạo cartService.ts
import {
  AddToCartPayload,
  CartData,
  UpdateCartItemPayload,
} from "@/types/cart";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

// --- Query Keys ---
export const cartKeys = {
  cart: ["cart"] as const, // Key cho toàn bộ giỏ hàng
};

// --- Custom Hook: Lấy giỏ hàng ---
export const useGetCart = (options?: { enabled?: boolean }) => {
  return useQuery<CartData, Error>({
    queryKey: cartKeys.cart,
    queryFn: getCartApi,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 1, // Dữ liệu cart có thể thay đổi thường xuyên, stale time ngắn
    // refetchOnWindowFocus: true, // Nên bật để cập nhật cart khi user quay lại tab
  });
};

// --- Custom Hook: Thêm sản phẩm vào giỏ ---
export const useAddToCart = () => {
  const t = useTranslations("reactQuery.cart");
  const queryClient = useQueryClient();
  return useMutation<CartData, Error, AddToCartPayload>({
    // Data trả về, Error, Kiểu dữ liệu input
    mutationFn: addItemToCartApi,
    onSuccess: (updatedCartData) => {
      // Cập nhật cache của React Query với dữ liệu mới
      queryClient.setQueryData(cartKeys.cart, updatedCartData);
    },
    onError: (error) => {
      toast.error(error.message || t("addError"));
    },
  });
};

// --- Custom Hook: Cập nhật item trong giỏ ---
export const useUpdateCartItem = () => {
  const t = useTranslations("reactQuery.cart");
  const queryClient = useQueryClient();
  return useMutation<
    CartData,
    Error,
    { itemId: string; payload: UpdateCartItemPayload }
  >({
    mutationFn: ({ itemId, payload }) => updateCartItemApi(itemId, payload),
    onSuccess: (updatedCartData) => {
      queryClient.setQueryData(cartKeys.cart, updatedCartData);
      toast.success(t("updateSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("updateError"));
    },
  });
};

// --- Custom Hook: Xóa item khỏi giỏ ---
export const useRemoveCartItem = () => {
  const t = useTranslations("reactQuery.cart");
  const queryClient = useQueryClient();
  return useMutation<CartData, Error, string>({
    // string là itemId
    mutationFn: removeCartItemApi,
    onSuccess: (updatedCartData) => {
      queryClient.setQueryData(cartKeys.cart, updatedCartData);
      toast.success(t("removeSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("removeError"));
    },
  });
};

// --- Custom Hook: Xóa toàn bộ giỏ hàng ---
export const useClearCart = () => {
  const t = useTranslations("reactQuery.cart");
  const queryClient = useQueryClient();
  return useMutation<CartData, Error>({
    mutationFn: clearCartApi,
    onSuccess: (updatedCartData) => {
      queryClient.setQueryData(cartKeys.cart, updatedCartData);
      toast.success(t("clearSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("clearError"));
    },
  });
};

export const useApplyCoupon = () => {
  const t = useTranslations("reactQuery.cart");
  const queryClient = useQueryClient();
  return useMutation<CartData, Error, string>({
    // string là couponCode
    mutationFn: applyCouponApi,
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.cart, updatedCart); // Cập nhật cache giỏ hàng
      toast.success(t("applyCouponSuccess"));
    },
    onError: (error) => {
      // Bắt lỗi cụ thể từ server nếu có
      toast.error(error.message || t("applyCouponError"));
    },
  });
};

export const useRemoveCoupon = () => {
  const t = useTranslations("reactQuery.cart");
  const queryClient = useQueryClient();
  return useMutation<CartData, Error, void>({
    // không cần input
    mutationFn: removeCouponApi,
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(cartKeys.cart, updatedCart);
      toast.success(t("removeCouponSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("removeCouponError"));
    },
  });
};
