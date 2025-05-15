"use client";
import { refreshTokenApi } from "@/services/authService";
import { AppDispatch, RootState } from "@/store";
import { logout, setAccessToken } from "@/store/slices/authSlice";
import { jwtDecode } from "jwt-decode";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

interface DecodedToken {
  exp: number; // Thời gian hết hạn (Unix timestamp)
}

const TOKEN_REFRESH_LEAD_TIME_MS = 5 * 60 * 1000; // Làm mới token 5 phút trước khi hết hạn

export function useAuthAutoRefresh() {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const refreshTokenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const scheduleTokenRefresh = () => {
      if (refreshTokenTimeoutRef.current) {
        clearTimeout(refreshTokenTimeoutRef.current);
      }

      if (!accessToken) {
        return;
      }

      try {
        const decodedToken = jwtDecode<DecodedToken>(accessToken);
        const expiresInMs = decodedToken.exp * 1000 - Date.now(); // Thời gian còn lại (ms)
        const refreshAtMs = expiresInMs - TOKEN_REFRESH_LEAD_TIME_MS; // Thời điểm cần refresh

        if (refreshAtMs > 0) {
          refreshTokenTimeoutRef.current = setTimeout(async () => {
            try {
              const data = await refreshTokenApi();
              dispatch(setAccessToken(data.accessToken));
              // Lên lịch refresh lại sau khi có token mới
              scheduleTokenRefresh();
            } catch (error) {
              console.error(
                "[AutoRefresh] Failed to refresh token, logging out.",
                error,
              );
              dispatch(logout()); // Logout nếu refresh thất bại
            }
          }, refreshAtMs);
        } else {
          // Token đã hết hạn hoặc sắp hết hạn ngay, thử refresh ngay hoặc logout
          if (expiresInMs < 0) {
            dispatch(logout());
          }
        }
      } catch {
        dispatch(logout()); // Nếu token không giải mã được, logout
      }
    };

    scheduleTokenRefresh();

    // Cleanup timeout khi component unmount hoặc accessToken thay đổi
    return () => {
      if (refreshTokenTimeoutRef.current) {
        clearTimeout(refreshTokenTimeoutRef.current);
      }
    };
  }, [accessToken, dispatch]);
}
