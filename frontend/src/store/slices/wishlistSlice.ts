import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WishlistState {
  itemCount: number;
}

const initialState: WishlistState = {
  itemCount: 0,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlistItemCount(state, action: PayloadAction<number>) {
      state.itemCount = action.payload;
    },
  },
});

export const { setWishlistItemCount } = wishlistSlice.actions;
export default wishlistSlice.reducer;
