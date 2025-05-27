import axiosInstance from "@/lib/axiosInstance";
import { WishlistItem } from "@/types";

export const getWishlist = async (): Promise<WishlistItem[]> => {
  const { data } = await axiosInstance.get<WishlistItem[]>("wishlist");
  return data;
};

interface AddToWishlistPayload {
  productId: string;
  variantId?: string | null; // Thêm variantId (tùy chọn)
}

// addToWishlist giờ nhận một object payload
export const addToWishlist = async (
  payload: AddToWishlistPayload,
): Promise<{ message: string }> => {
  // API backend của bạn (trong controller) đang nhận productId và variantId từ req.body
  const { data } = await axiosInstance.post<{ message: string }>(
    "wishlist", // Endpoint POST /v1/wishlist
    payload,    // Gửi payload trong body
  );
  return data;
};

interface RemoveFromWishlistParams {
  productId: string;
  variantId?: string | null; // Thêm variantId (tùy chọn)
}
// removeFromWishlist giờ nhận một object params và gửi chúng qua query params
export const removeFromWishlist = async (
  params: RemoveFromWishlistParams,
): Promise<{ message: string }> => {
  // API backend của bạn (trong controller) đang nhận productId và variantId từ req.query
  const { data } = await axiosInstance.delete<{ message: string }>(
    "wishlist/remove", // Endpoint DELETE /v1/wishlist/remove
    { params }, // Gửi params dưới dạng query parameters
  );
  return data;
};