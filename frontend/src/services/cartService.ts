// src/services/cartService.ts
import axiosInstance from "@/lib/axiosInstance";
import {
  AddToCartPayload,
  CartData,
  UpdateCartItemPayload,
} from "@/types/cart"; // Tạo các type này

export const getCart = async (): Promise<CartData> => {
  const { data } = await axiosInstance.get<CartData>("/cart");
  return data;
};

export const addItemToCart = async (
  payload: AddToCartPayload,
): Promise<CartData> => {
  const { data } = await axiosInstance.post<CartData>("/cart/items", payload);
  return data;
};

export const updateCartItem = async (
  itemId: string,
  payload: UpdateCartItemPayload,
): Promise<CartData> => {
  const { data } = await axiosInstance.put<CartData>(
    `/cart/items/${itemId}`,
    payload,
  );
  return data;
};

export const removeCartItem = async (itemId: string): Promise<CartData> => {
  const { data } = await axiosInstance.delete<CartData>(
    `/cart/items/${itemId}`,
  );
  return data;
};

export const clearCart = async (): Promise<CartData> => {
  const { data } = await axiosInstance.delete<CartData>("/cart");
  return data;
};

// Thêm service cho apply/remove coupon
export const applyCoupon = async (couponCode: string): Promise<CartData> => {
  const { data } = await axiosInstance.post<CartData>("/cart/apply-coupon", {
    couponCode,
  });
  return data;
};

export const removeCoupon = async (): Promise<CartData> => {
  const { data } = await axiosInstance.delete<CartData>("/cart/remove-coupon");
  return data;
};
