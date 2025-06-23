"use client";

import GuestGuard from "@/app/GuestGuard";
import axiosInstance from "@/lib/axiosInstance";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

interface ResetPasswordPageClientProps {
  token: string;
}

export default function ResetPasswordPage({
  token,
}: ResetPasswordPageClientProps) {
  const router = useRouter();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null); // Để kiểm tra token ban đầu (tùy chọn)

  // Kiểm tra token có vẻ hợp lệ không khi component mount
  useEffect(() => {
    if (token && token.length < 20) {
      // Ví dụ: token quá ngắn là không hợp lệ
      setError("Token đặt lại mật khẩu không hợp lệ.");
      setIsValidToken(false);
    } else if (token) {
      setIsValidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("Token đặt lại mật khẩu không hợp lệ hoặc bị thiếu.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put<{ message: string }>(
        `/auth/reset-password/${token}`,
        { password },
      );
      setMessage(
        response.data.message || "Mật khẩu của bạn đã được đặt lại thành công!",
      );
      // Tự động chuyển hướng về login sau vài giây
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Đặt lại mật khẩu thất bại. Token có thể không hợp lệ hoặc đã hết hạn.";
      setError(errorMessage);
      console.error("Reset password failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isValidToken === false) {
    // Nếu đã xác định token không hợp lệ từ đầu
    return (
      <div className="flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Lỗi Token</h1>
          <p className="mb-6 text-gray-700">
            {error || "Token đặt lại mật khẩu không hợp lệ."}
          </p>
          <Link
            href="/forgot-password"
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            Yêu cầu liên kết mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <GuestGuard>
      <div className="flex items-center justify-center bg-gray-100 px-4 md:px-0">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
            Đặt Lại Mật Khẩu
          </h1>
          {!message && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <p className="rounded-md bg-red-100 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="password"
                >
                  Mật khẩu mới *
                </label>
                <input
                  className="input-field"
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="confirmPassword"
                >
                  Xác nhận mật khẩu mới *
                </label>
                <input
                  className={`input-field ${password !== confirmPassword && confirmPassword ? "border-red-500" : ""}`}
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {password !== confirmPassword && confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    Mật khẩu không khớp.
                  </p>
                )}
              </div>
              <div>
                <button
                  className={`flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${loading ? "cursor-not-allowed bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
                </button>
              </div>
            </form>
          )}
          {message && (
            <div className="text-center">
              <p className="mb-6 rounded-md bg-green-100 p-4 text-lg text-green-600">
                {message}
              </p>
              <Link
                href="/login"
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                Đi đến Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </GuestGuard>
  );
}
