"use client";

import GuestGuard from "@/app/GuestGuard";
import { registerUser } from "@/services/authService";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const t = useTranslations("RegisterPage");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  // State riêng cho lỗi xác nhận mật khẩu
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const passwordHintKeys = [
    "length",
    "uppercase",
    "lowercase",
    "number",
    "special",
  ];

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setConfirmPasswordError(null); // Reset lỗi confirm password mỗi khi submit

    // --- Validate các trường rỗng ---
    const requiredFields = [
      { value: name, key: "fullNameLabel" },
      { value: email, key: "emailLabel" },
      { value: phone, key: "phoneLabel" },
      { value: password, key: "passwordLabel" },
      { value: confirmPassword, key: "confirmPasswordLabel" },
    ];

    for (const field of requiredFields) {
      if (!field.value.trim()) {
        setError(
          t("validation.required", { field: t(field.key).replace(" *", "") }),
        );
        return;
      }
    }

    // --- Validate định dạng email ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t("validation.invalidEmail"));
      return;
    }

    // --- Validate định dạng số điện thoại Việt Nam ---
    const phoneVNRegex =
      /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
    if (!phoneVNRegex.test(phone)) {
      setError(t("validation.invalidPhone"));
      return;
    }

    // --- Validate độ phức tạp của mật khẩu ---
    const passwordRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])",
    );
    if (password.length < 6 || !passwordRegex.test(password)) {
      setError(t("validation.passwordComplexity"));
      return;
    }

    // --- Validate xác nhận mật khẩu, chỉ set lỗi riêng ---
    if (password !== confirmPassword) {
      setConfirmPasswordError(t("validation.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({ name, email, phone, password });
      // Chuyển hướng đến trang xác thực OTP, truyền email qua query param
      router.push(
        `/verify-email?email=${encodeURIComponent(email)}&message=${encodeURIComponent(
          data.message || t("registerSuccessMessage"),
        )}`,
      );
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("validation.failure");

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-xl bg-white px-6 py-8 shadow-xl sm:p-10">
          <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
            {t("title")}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="rounded-md bg-red-100 p-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="name"
              >
                {t("fullNameLabel")}
              </label>
              <input
                className="input-field"
                id="name"
                type="text"
                placeholder={t("fullNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="phone"
              >
                {t("phoneLabel")}
              </label>
              <input
                className="input-field"
                id="phone"
                type="tel"
                placeholder={t("phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="password"
              >
                {t("passwordLabel")}
              </label>
              <input
                className="input-field"
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <ul className="mt-2 list-inside list-disc text-sm text-gray-500">
                {passwordHintKeys.map((key) => (
                  <li key={key}>{t(`passwordHint.${key}`)}</li>
                ))}
              </ul>
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="confirmPassword"
              >
                {t("confirmPasswordLabel")}
              </label>
              <input
                className={`input-field ${confirmPasswordError ? "border-red-500" : ""}`}
                id="confirmPassword"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) {
                    setConfirmPasswordError(null);
                  }
                }}
                required
              />
              {confirmPasswordError && (
                <p className="mt-1 text-xs text-red-500">
                  {confirmPasswordError}
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
          <p className="mt-6 text-center text-sm text-gray-600">
            {t("loginPrompt")}{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
            >
              {t("loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
