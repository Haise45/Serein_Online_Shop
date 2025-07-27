"use client";

import GuestGuard from "@/app/GuestGuard";
import axiosInstance from "@/lib/axiosInstance";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPasswordPage");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await axiosInstance.post<{ message: string }>(
        "/auth/forgot-password",
        { email },
      );
      setMessage(response.data.message || t("successMessage"));
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message || error.message || t("failureMessage");
      setError(errorMessage);
      console.error("Forgot password failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-xl bg-white px-6 py-8 shadow-xl sm:p-10">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
            {t("title")}
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            {t("instructions")}
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="rounded-md bg-red-100 p-3 text-sm text-red-600">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-md bg-green-100 p-3 text-sm text-green-600">
                {message}
              </p>
            )}
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="email"
              >
                {t("emailLabel")}
              </label>
              <input
                className="input-field"
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
          <p className="mt-6 text-center text-sm text-gray-600">
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              {t("backToLoginLink")}
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
