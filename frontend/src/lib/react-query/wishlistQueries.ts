import {
  addToWishlist as addToWishlistApi,
  getWishlist as getWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from "@/services/wishlistService";
import { WishlistItem } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("reactQuery.wishlist");
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, AddToWishlistVariables>({
    // Sử dụng AddToWishlistVariables
    mutationFn: addToWishlistApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      toast.success(data.message || t("addSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("addError"));
    },
  });
};

// --- Custom Hook: Xóa khỏi wishlist ---
export const useRemoveFromWishlist = () => {
  const t = useTranslations("reactQuery.wishlist");
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, RemoveFromWishlistVariables>({
    // Sử dụng RemoveFromWishlistVariables
    mutationFn: removeFromWishlistApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      toast.success(data.message || t("removeSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("removeError"));
    },
  });
};
