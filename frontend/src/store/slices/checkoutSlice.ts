import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CheckoutState {
  selectedItemIdsForCheckout: string[]; // Mảng các ID của CartItem được chọn
}

const initialState: CheckoutState = {
  selectedItemIdsForCheckout: [],
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    // Action để set các item được chọn khi người dùng tiến hành thanh toán
    setSelectedItemsForCheckout: (state, action: PayloadAction<string[]>) => {
      state.selectedItemIdsForCheckout = action.payload;
      console.log('[CheckoutSlice] Selected items for checkout set:', action.payload);
    },
    // Action để xóa các item đã chọn sau khi checkout thành công hoặc khi rời trang
    clearSelectedItemsForCheckout: (state) => {
      state.selectedItemIdsForCheckout = [];
      console.log('[CheckoutSlice] Cleared selected items for checkout.');
    },
  },
});

export const { setSelectedItemsForCheckout, clearSelectedItemsForCheckout } = checkoutSlice.actions;
export default checkoutSlice.reducer;