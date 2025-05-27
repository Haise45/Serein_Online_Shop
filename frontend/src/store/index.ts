import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import wishlistReducer from "./slices/wishlistSlice";
import notificationPopupReducer from "./slices/notificationPopupSlice";
import checkoutReducer from "./slices/checkoutSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    notificationPopup: notificationPopupReducer,
    checkout: checkoutReducer,
    // Thêm các reducers khác ở đây
  },
  // Middleware (tùy chọn, ví dụ Redux Logger cho dev)
  // middleware: (getDefaultMiddleware) =>
  //   getDefaultMiddleware().concat(logger),
  devTools: process.env.NODE_ENV !== "production", // Bật Redux DevTools ở dev
});

// Định nghĩa kiểu cho RootState và AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export * from "./slices/authSlice";
