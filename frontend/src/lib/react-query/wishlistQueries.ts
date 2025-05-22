// src/lib/react-query/wishlistQueries.ts
import {
  addToWishlist as addToWishlistApi,
  getWishlist as getWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from "@/services/wishlistService";
import { WishlistItem } from "@/types"; // Sử dụng WishlistItem đã cập nhật
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// --- Query Keys ---
export const wishlistKeys = {
  wishlist: ["wishlist"] as const,
};

// --- Types cho payload/params của mutation ---
interface AddToWishlistVariables {
  productId: string;
  variantId?: string | null;
}

interface RemoveFromWishlistVariables {
  productId: string;
  variantId?: string | null;
}

// --- Custom Hook: Lấy wishlist ---
export const useGetWishlist = (options?: { enabled?: boolean }) => {
  return useQuery<WishlistItem[], Error>({
    queryKey: wishlistKeys.wishlist,
    queryFn: getWishlistApi,
    enabled: options?.enabled ?? true,
  });
};

// --- Custom Hook: Thêm vào wishlist ---
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, AddToWishlistVariables>({
    // Sử dụng AddToWishlistVariables
    mutationFn: addToWishlistApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      toast.success(data.message || "Đã thêm vào danh sách yêu thích!");
    },
    onError: (error) => {
      toast.error(error.message || "Thêm vào yêu thích thất bại.");
    },
  });
};

// --- Custom Hook: Xóa khỏi wishlist ---
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, RemoveFromWishlistVariables>({
    // Sử dụng RemoveFromWishlistVariables
    mutationFn: removeFromWishlistApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      toast.success(data.message || "Đã xóa khỏi danh sách yêu thích.");
    },
    onError: (error) => {
      toast.error(error.message || "Xóa khỏi yêu thích thất bại.");
    },
  });
};
