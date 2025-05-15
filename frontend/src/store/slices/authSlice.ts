import { User } from "@/types/user";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthSliceState {
  // Đổi tên interface để rõ ràng hơn
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthSliceState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Lấy access token từ localStorage khi slice được load
if (typeof window !== "undefined") {
  const storedToken = localStorage.getItem("accessToken");
  if (storedToken) {
    initialState.accessToken = storedToken;
    initialState.isAuthenticated = true;
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(
      state,
      action: PayloadAction<{ user: User; accessToken: string }>,
    ) {
      state.user = action.payload.user; // Cập nhật user vào Redux state
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", action.payload.accessToken);
      }
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
    },
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
      if (action.payload) {
        if (!state.isAuthenticated && state.user) {
          // Trường hợp hiếm: user có nhưng chưa authenticated
          state.isAuthenticated = true;
        } else if (!state.user) {
          // Nếu chưa có user, có thể đây là lần đầu load, hoặc refresh thất bại rồi lại thành công
          // không set isAuthenticated ở đây, chờ getMyProfile và loginSuccess
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", action.payload);
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
        }
      }
    },
    setUser(state, action: PayloadAction<User | null>) {
      // Chỉ cập nhật user trong Redux state, không tương tác với localStorage
      state.user = action.payload;
      // Nếu set user, và có token, thì nên là authenticated
      if (action.payload && state.accessToken) {
        state.isAuthenticated = true;
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setAccessToken,
  setUser,
} = authSlice.actions;
export default authSlice.reducer;
