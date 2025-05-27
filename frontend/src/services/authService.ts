import axiosInstance from "@/lib/axiosInstance";
import { LoginCredentials, LoginResponse, RegisterData } from "@/types/api"; // Tạo các type này
import { User } from "@/types/user";

export const loginUser = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  const { data } = await axiosInstance.post<LoginResponse>(
    "auth/login",
    credentials,
  );
  return data;
};

export const loginUserWithRefresh = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  const { data } = await axiosInstance.post<LoginResponse>(
    "auth/login-refresh",
    credentials,
  );
  return data;
};

export const registerUser = async (
  userData: RegisterData,
): Promise<{ message: string; userId: string }> => {
  // Backend trả về message và userId sau khi đăng ký (chưa có token)
  const { data } = await axiosInstance.post<{
    message: string;
    userId: string;
  }>("auth/register", userData);
  return data;
};

export const verifyEmailOTP = async (payload: {
  email: string;
  otp: string;
}): Promise<LoginResponse> => {
  // API này sẽ trả về thông tin user và token sau khi verify thành công
  const { data } = await axiosInstance.post<LoginResponse>(
    "auth/verify-email",
    payload,
  );
  return data;
};

export const resendVerificationEmail = async (payload: {
  email: string;
}): Promise<{ message: string }> => {
  const { data } = await axiosInstance.post<{ message: string }>(
    "auth/resend-verification-email",
    payload,
  );
  return data;
};

export const getMyProfile = async (): Promise<User> => {
  // Giả sử API trả về User
  const { data } = await axiosInstance.get<User>("users/profile");
  return data;
};

export const refreshTokenApi = async (): Promise<{ accessToken: string }> => {
  const { data } = await axiosInstance.post<{ accessToken: string }>(
    "auth/refresh",
  );
  return data;
};

export const logoutUserApi = async (): Promise<{ message: string }> => {
  const { data } = await axiosInstance.post<{ message: string }>(
    "auth/logout",
  );
  return data;
};
