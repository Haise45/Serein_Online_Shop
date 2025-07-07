"use client";

import GuestGuard from "@/app/GuestGuard";
import axiosInstance from "@/lib/axiosInstance";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("ResetPasswordPage");

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
      setError(t("invalidTokenError"));
      setIsValidToken(false);
    } else if (token) {
      setIsValidToken(true);
    }
  }, [token, t]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError(t("invalidTokenError"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("passwordLengthError"));
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put<{ message: string }>(
        `/auth/reset-password/${token}`,
        { password },
      );
      setMessage(response.data.message || t("successMessage"));
      // Tự động chuyển hướng về login sau vài giây
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("invalidTokenError");
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
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            {t("tokenErrorTitle")}
          </h1>
          <p className="mb-6 text-gray-700">
            {error || t("invalidTokenError")}
          </p>
          <Link
            href="/forgot-password"
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
          >
            {t("requestNewLinkButton")}
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
            {t("title")}
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
                  {t("newPasswordLabel")}
                </label>
                <input
                  className="input-field"
                  id="password"
                  type="password"
                  placeholder={t("newPasswordPlaceholder")}
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
                  {t("confirmPasswordLabel")}
                </label>
                <input
                  className={`input-field ${password !== confirmPassword && confirmPassword ? "border-red-500" : ""}`}
                  id="confirmPassword"
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {password !== confirmPassword && confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {t("passwordMismatch")}
                  </p>
                )}
              </div>
              <div>
                <button
                  className={`flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${loading ? "cursor-not-allowed bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? t("submitButtonLoading") : t("submitButton")}
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
                {t("goToLoginButton")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </GuestGuard>
  );
}
