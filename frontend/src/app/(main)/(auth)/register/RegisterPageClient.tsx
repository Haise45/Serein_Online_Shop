"use client";

import { registerUser } from "@/services/authService";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // --- Validate các trường rỗng ---
    const requiredFields = [
      { value: name, label: "Họ tên" },
      { value: email, label: "Email" },
      { value: phone, label: "Số điện thoại" },
      { value: password, label: "Mật khẩu" },
      { value: confirmPassword, label: "Xác nhận mật khẩu" },
    ];

    for (const field of requiredFields) {
      if (!field.value.trim()) {
        setError(`Vui lòng nhập ${field.label}.`);
        return;
      }
    }

    // --- Validate định dạng email ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ.");
      return;
    }

    // --- Validate định dạng số điện thoại Việt Nam ---
    const phoneVNRegex =
      /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
    if (!phoneVNRegex.test(phone)) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    // --- Validate độ dài mật khẩu ---
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    // --- Validate xác nhận mật khẩu ---
    if (password !== confirmPassword) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({ name, email, phone, password });
      // Chuyển hướng đến trang xác thực OTP, truyền email qua query param
      router.push(
        `/verify-email?email=${encodeURIComponent(email)}&message=${encodeURIComponent(data.message)}`,
      );
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";

      setError(errorMessage);
      console.error("Register failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-xl bg-white py-8 px-6 shadow-xl sm:p-10">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
          Đăng Ký Tài Khoản
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
              Họ và Tên *
            </label>
            <input
              className="input-field"
              id="name"
              type="text"
              placeholder="Họ và tên của bạn"
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
              Email *
            </label>
            <input
              className="input-field"
              id="email"
              type="email"
              placeholder="Email của bạn"
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
              Số Điện Thoại *
            </label>
            <input
              className="input-field"
              id="phone"
              type="tel"
              placeholder="Số điện thoại của bạn"
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
              Mật khẩu *
            </label>
            <input
              className="input-field"
              id="password"
              type="password"
              placeholder="••••••••"
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
              Xác Nhận Mật khẩu *
            </label>
            <input
              className={`input-field ${password !== confirmPassword && confirmPassword ? "border-red-500" : ""}`}
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {password !== confirmPassword && confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Mật khẩu không khớp.</p>
            )}
          </div>
          <div>
            <button
              className={`flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${loading ? "cursor-not-allowed bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đăng Ký"}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
