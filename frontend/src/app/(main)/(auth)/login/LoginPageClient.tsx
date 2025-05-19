"use client";

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
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to get query parameters
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    dispatch(loginStart());

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Địa chỉ email không hợp lệ");
      dispatch(loginFailure("Địa chỉ email không hợp lệ"));
      setLoading(false); // Ensure loading is set to false
      return;
    }

    try {
      let data: LoginResponse;
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
            role: data.role as "admin" | "customer",
            phone: data.phone,
            isEmailVerified: data.isEmailVerified,
          },
          accessToken: data.accessToken,
        }),
      );
      toast.success("Đăng nhập thành công!");

      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });

      const redirectPath = searchParams.get("redirect"); // Get the redirect path from query params

      if (!data.isEmailVerified) {
        router.push(
          `/verify-email?email=${encodeURIComponent(data.email)}&message=${encodeURIComponent("Vui lòng xác thực email của bạn.")}`,
        );
      } else if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (redirectPath) {
        // If a redirect path is provided, use it
        router.push(redirectPath);
      } else {
        // Otherwise, redirect to homepage for regular users
        router.push("/");
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
    <div className="flex items-center justify-center bg-gray-100 px-4 md:px-0">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
          Đăng Nhập
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="input-field w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              id="email"
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <input
              className="input-field w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 rounded text-indigo-600 transition duration-150 ease-in-out"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span className="ml-2 text-sm text-gray-600">Ghi nhớ tôi</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div>
            <button
              className={`flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${
                loading
                  ? "cursor-not-allowed bg-indigo-400"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng Nhập"}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
