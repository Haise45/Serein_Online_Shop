"use client";

import { getMyProfile, refreshTokenApi } from "@/services/authService";
import { AppDispatch, RootState } from "@/store";
import {
  loginFailure,
  loginSuccess,
  logout,
  setAccessToken,
} from "@/store/slices/authSlice";
import { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useAuthInitializer() {
  const dispatch = useDispatch<AppDispatch>();
  // accessToken sẽ được đọc từ localStorage vào initialState của authSlice
  const { isAuthenticated, accessToken } = useSelector(
    (state: RootState) => state.auth,
  );
  const [isInitializing, setIsInitializing] = useState(true);
  const didInitialize = useRef(false);

  useEffect(() => {
    if (didInitialize.current) {
      if (isInitializing) setIsInitializing(false);
      return;
    }

    didInitialize.current = true;

    const initializeAuth = async () => {
      setIsInitializing(true);

      // 1. Nếu có accessToken trong Redux
      // Dùng nó để lấy thông tin user.
      if (accessToken) {
        try {
          const profile = await getMyProfile(); // getMyProfile dùng token từ interceptor (đã lấy từ Redux state)
          // Nếu thành công, dispatch loginSuccess để set user và đảm bảo accessToken đúng, isAuthenticated = true
          // accessToken trong Redux lúc này chính là accessToken đã dùng để gọi getMyProfile thành công.
          dispatch(loginSuccess({ user: profile, accessToken: accessToken }));
          setIsInitializing(false);
          return;
        } catch (profileError) {
          console.warn("Attempting refresh.", profileError);
        }
      }

      // 2. Nếu không có accessToken trong Redux HOẶC getMyProfile ở trên thất bại, thử refresh token.
      // Backend sẽ đọc httpOnly refresh token cookie.
      try {
        const refreshData = await refreshTokenApi();
        const newAccessToken = refreshData.accessToken;
        dispatch(setAccessToken(newAccessToken)); // Đảm bảo token mới trong store và localStorage cho getMyProfile
        const profile = await getMyProfile(); // Giờ getMyProfile sẽ dùng token mới từ store

        dispatch(loginSuccess({ user: profile, accessToken: newAccessToken }));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        let errorMessage = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
        dispatch(loginFailure(errorMessage)); // Thông báo lỗi có thể không cần hiển thị cho user
        dispatch(logout()); // Đảm bảo trạng thái là đã logout và token cũ (nếu có) bị xóa
      } finally {
        setIsInitializing(false);
        console.log("AuthInitializer: Initialization process finished.");
      }
    };
    initializeAuth();
  }, [dispatch, accessToken, isAuthenticated, isInitializing]);

  return { isAuthInitializing: isInitializing };
}
