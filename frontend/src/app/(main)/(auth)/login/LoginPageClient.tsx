"use client";

import GuestGuard from "@/app/GuestGuard";
import { loginUser, loginUserWithRefresh } from "@/services/authService";
import { AppDispatch } from "@/store";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "@/store/slices/authSlice";
import { LoginResponse } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; // Đã import
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [redirectUrl, setRedirectUrl] = useState<string>("/"); // State để lưu URL chuyển hướng

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams(); // Hook để đọc query params

  // Lấy URL redirect từ query params khi component mount
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect && redirect.startsWith("/")) {
      try {
        const decodedRedirect = decodeURIComponent(redirect);
        setRedirectUrl(decodedRedirect);
      } catch {
        setRedirectUrl("/"); // Fallback
      }
    } else if (redirect) {
      setRedirectUrl("/"); // Fallback cho redirect không hợp lệ
    }
    // Nếu không có redirect param, redirectUrl sẽ giữ giá trị mặc định là "/"
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    dispatch(loginStart());

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Địa chỉ email không hợp lệ");
      dispatch(loginFailure("Địa chỉ email không hợp lệ"));
      setLoading(false);
      return;
    }

    try {
      let data: LoginResponse; // Khai báo data ở đây
      if (rememberMe) {
        data = await loginUserWithRefresh({ email, password });
      } else {
        data = await loginUser({ email, password });
      }

      dispatch(
        loginSuccess({
          user: {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role as "admin" | "customer", // Đảm bảo role có kiểu cụ thể
            phone: data.phone,
            isEmailVerified: data.isEmailVerified,
            // Thêm các trường khác từ LoginResponse nếu User type của bạn cần
          },
          accessToken: data.accessToken, // Giả sử LoginResponse có accessToken
        }),
      );
      toast.success("Đăng nhập thành công!");

      // Invalidate queries để fetch lại dữ liệu mới cho user đã đăng nhập
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });

      if (!data.isEmailVerified) {
        // Nếu email chưa xác thực, chuyển đến trang xác thực và mang theo redirectUrl
        router.push(
          `/verify-email?email=${encodeURIComponent(data.email)}&message=${encodeURIComponent("Vui lòng xác thực email của bạn.")}&redirect=${encodeURIComponent(redirectUrl)}`,
        );
      } else if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        // Chuyển hướng về redirectUrl đã lưu (hoặc trang mặc định nếu redirectUrl không hợp lệ)
        const finalRedirect =
          redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : "/";
        router.push(finalRedirect);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại.";
      toast.error(errorMessage);
      dispatch(loginFailure(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-xl bg-white px-6 py-8 shadow-xl sm:p-10">
          {/* ... Tiêu đề và form ... */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Đăng Nhập
            </h1>
            <p className="mt-2 text-sm text-gray-600">Chào mừng trở lại!</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* ... Inputs for email, password ... */}
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-gray-700"
                htmlFor="email"
              >
                Email của bạn
              </label>
              <input
                className="input-field"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                  htmlFor="password"
                >
                  Mật khẩu
                </label>
              </div>
              <input
                className="input-field"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Ghi nhớ tôi
                </label>
              </div>
              <Link
                href="/forgot-password" // Trang forgot-password sẽ tự xử lý redirect nếu cần
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div>
              <button
                className={`flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${loading ? "cursor-not-allowed bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                type="submit"
                disabled={loading}
              >
                {/* ... Loading state ... */}
                {loading ? (
                  <>
                    <svg
                      className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  "Đăng Nhập"
                )}
              </button>
            </div>
          </form>
          <p className="mt-8 text-center text-sm text-gray-600">
            Chưa có tài khoản?{" "}
            <Link
              href={`/register${redirectUrl && redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`}
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
