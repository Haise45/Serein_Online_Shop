import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import { Cart } from '@/types/cart'; // Tạo type Cart

async function getCartData(): Promise<Cart | null> {
    try {
        // Backend API /cart sẽ tự động dùng token (nếu có) hoặc guestId cookie
        const cart = await fetchApi('/cart');
        return cart;
    } catch (error) {
        console.warn("Không thể lấy dữ liệu giỏ hàng cho Navbar:", error);
        return null; // Trả về null nếu lỗi hoặc không có giỏ hàng
    }
}

export function useCart() {
  return useQuery<Cart | null, Error>({ // Kiểu dữ liệu trả về và kiểu lỗi
    queryKey: ['cart'], // Khóa cache cho React Query
    queryFn: getCartData,
    // staleTime: 5 * 60 * 1000, // Dữ liệu được coi là cũ sau 5 phút
    // refetchOnWindowFocus: true, // Tự động fetch lại khi focus
  });
}