// src/lib/react-query/wishlistQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWishlist as getWishlistApi,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from '@/services/wishlistService'; // Giả sử bạn đã tạo wishlistService.ts
import { WishlistItem } from '@/types';
import toast from 'react-hot-toast';

// --- Query Keys ---
export const wishlistKeys = {
  wishlist: ['wishlist'] as const,
};

// --- Custom Hook: Lấy wishlist ---
export const useGetWishlist = (options?: { enabled?: boolean }) => {
  return useQuery<WishlistItem[], Error>({ // API trả về mảng WishlistItem
    queryKey: wishlistKeys.wishlist,
    queryFn: getWishlistApi,
    enabled: options?.enabled ?? true,
    // staleTime: 1000 * 60 * 5, // Wishlist có thể cache lâu hơn cart
  });
};

// --- Custom Hook: Thêm vào wishlist ---
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation< { message: string }, Error, string >({ // string là productId
    mutationFn: addToWishlistApi,
    onSuccess: (data) => {
      // Invalidate cache của wishlist để fetch lại
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      toast.success(data.message || 'Đã thêm vào danh sách yêu thích!');
    },
    onError: (error) => {
      toast.error(error.message || 'Thêm vào yêu thích thất bại.');
    }
  });
};

// --- Custom Hook: Xóa khỏi wishlist ---
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation< { message: string }, Error, string >({ // string là productId
    mutationFn: removeFromWishlistApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.wishlist });
      toast.success(data.message || 'Đã xóa khỏi danh sách yêu thích.');
    },
    onError: (error) => {
      toast.error(error.message || 'Xóa khỏi yêu thích thất bại.');
    }
  });
};