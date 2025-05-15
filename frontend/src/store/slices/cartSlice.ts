import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// Giả sử bạn có type CartItem và Cart từ backend
// import { CartItem, Cart } from '@/types/cart';

interface CartState {
  items: unknown[]; // Nên dùng type CartItem[]
  totalQuantity: number;
  subtotal: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  totalQuantity: 0,
  subtotal: 0,
  isLoading: false,
  error: null,
};

// Cố gắng load từ localStorage nếu có (chỉ totalQuantity cho đơn giản)
if (typeof window !== 'undefined') {
    const storedCartTotalQty = localStorage.getItem('cartTotalQuantity');
    if (storedCartTotalQty) {
        initialState.totalQuantity = parseInt(storedCartTotalQty, 10) || 0;
    }
}


const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setCart(state, action: PayloadAction<{ items: unknown[]; totalQuantity: number; subtotal: number }>) {
      state.items = action.payload.items;
      state.totalQuantity = action.payload.totalQuantity;
      state.subtotal = action.payload.subtotal;
      state.error = null;
      if (typeof window !== 'undefined') { // Lưu lại totalQuantity
        localStorage.setItem('cartTotalQuantity', state.totalQuantity.toString());
      }
    },
    setCartError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    // Action khi thêm/sửa/xóa item để cập nhật totalQuantity
    // Hoặc đơn giản là gọi API lấy lại toàn bộ cart và dùng setCart
    updateCartQuantity(state, action: PayloadAction<number>) {
        state.totalQuantity = action.payload;
         if (typeof window !== 'undefined') {
            localStorage.setItem('cartTotalQuantity', state.totalQuantity.toString());
        }
    }
  },
});

export const { setCartLoading, setCart, setCartError, updateCartQuantity } = cartSlice.actions;
export default cartSlice.reducer;