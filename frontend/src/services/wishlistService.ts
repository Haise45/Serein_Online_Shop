import axiosInstance from "@/lib/axiosInstance";
import { WishlistItem } from "@/types"; // Tạo type WishlistItem

// API /wishlist của bạn có thể trả về mảng Product[] trực tiếp
export const getWishlist = async (): Promise<WishlistItem[]> => {
  const { data } = await axiosInstance.get<WishlistItem[]>("/wishlist");
  return data;
};

export const addToWishlist = async (
  productId: string,
): Promise<{ message: string }> => {
  const { data } = await axiosInstance.post<{ message: string }>(
    `/wishlist/${productId}`,
  );
  return data;
};

export const removeFromWishlist = async (
  productId: string,
): Promise<{ message: string }> => {
  const { data } = await axiosInstance.delete<{ message: string }>(
    `/wishlist/${productId}`,
  );
  return data;
};
