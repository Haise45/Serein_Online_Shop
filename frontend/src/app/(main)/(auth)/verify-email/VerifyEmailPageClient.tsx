"use client";

import {
  resendVerificationEmail,
  verifyEmailOTP,
} from "@/services/authService";
import { AppDispatch } from "@/store";
import { loginSuccess } from "@/store/slices/authSlice";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]); // Mảng 6 ký tự
  const [emailFromQuery, setEmailFromQuery] = useState<string>("");
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    const email = searchParams.get("email");
    const message = searchParams.get("message");
    if (email) {
      setEmailFromQuery(email);
    } else {
      // Nếu không có email, có thể redirect về register hoặc login
      // router.replace('/register');
      setError("Không tìm thấy thông tin email để xác thực.");
    }
    if (message) {
      setInitialMessage(decodeURIComponent(message));
    }
  }, [searchParams, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    // Chỉ cho phép nhập số và chỉ 1 ký tự
    if (/^[0-9]$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Tự động focus input tiếp theo nếu nhập ký tự
      if (value !== "" && index < otp.length - 1) {
        const nextSibling = e.target
          .nextElementSibling as HTMLInputElement | null;
        nextSibling?.focus();
      }
      // Tự động focus input trước đó nếu xóa ký tự (Backspace)
      else if (value === "" && index > 0) {
        const previousSibling = e.target
          .previousElementSibling as HTMLInputElement | null;
        previousSibling?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^0-9]/g, ""); // Chỉ lấy số
    if (pasteData.length === 6) {
      setOtp(pasteData.split(""));
      // Focus vào input cuối cùng hoặc nút submit
      const lastInput = e.currentTarget.parentElement?.children[
        otp.length - 1
      ] as HTMLInputElement | null;
      lastInput?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6 || !emailFromQuery) {
      setError("Vui lòng nhập đủ 6 số OTP và đảm bảo có email.");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyEmailOTP({
        email: emailFromQuery,
        otp: enteredOtp,
      });
      setSuccessMessage(
        data.message || "Xác thực email thành công! Đang chuyển hướng...",
      );

      // Tự động đăng nhập user
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

      // Chuyển hướng sau khi thành công
      setTimeout(() => {
        if (data.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/"); // Hoặc trang profile client
        }
      }, 2000); // Đợi 2s để user đọc message
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Xác thực OTP thất bại.";
      setError(errorMessage);
      console.error("OTP verification failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !emailFromQuery) return;
    setError(null);
    setSuccessMessage(null);
    setResendLoading(true);
    try {
      const data = await resendVerificationEmail({ email: emailFromQuery });
      setSuccessMessage(
        data.message || "Mã OTP mới đã được gửi. Vui lòng kiểm tra email.",
      );
      setResendCooldown(RESEND_COOLDOWN_SECONDS); // Bắt đầu đếm ngược
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gửi lại OTP thất bại.";
      setError(errorMessage);
      console.error("Resend OTP failed:", err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-xl bg-white px-6 py-8 shadow-xl sm:p-10">
        <h1 className="mb-4 text-center text-3xl font-bold text-gray-800">
          Xác Thực Email
        </h1>
        {initialMessage && (
          <p className="mb-4 rounded-md bg-green-50 p-3 text-center text-sm text-green-600">
            {initialMessage}
          </p>
        )}
        <p className="mb-6 text-center text-sm text-gray-600">
          Một mã OTP gồm 6 chữ số đã được gửi đến{" "}
          <strong>{emailFromQuery || "email của bạn"}</strong>. Vui lòng nhập mã
          vào bên dưới.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-md bg-red-100 p-3 text-sm text-red-600">
              {error}
            </p>
          )}
          {successMessage && !error && (
            <p className="rounded-md bg-green-100 p-3 text-sm text-green-600">
              {successMessage}
            </p>
          )}

          <div className="flex justify-center space-x-1.5 sm:space-x-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text" // Dùng text để dễ dàng style và xử lý hơn number
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e, index)}
                onFocus={(e) => e.target.select()} // Chọn toàn bộ text khi focus
                className="h-12 w-9 sm:h-14 sm:w-12 rounded-md border border-gray-300 text-center text-2xl font-semibold shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={loading}
                aria-label={`Ký tự OTP thứ ${index + 1}`}
              />
            ))}
          </div>

          <div>
            <button
              className={`flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${loading ? "cursor-not-allowed bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
              type="submit"
              disabled={loading || otp.join("").length !== 6}
            >
              {loading ? "Đang xác thực..." : "Xác Thực Mã OTP"}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={handleResendOtp}
            disabled={resendLoading || resendCooldown > 0 || !emailFromQuery}
            className={`text-sm font-medium ${!emailFromQuery || resendCooldown > 0 ? "cursor-not-allowed text-gray-400" : "text-indigo-600 hover:text-indigo-500"}`}
          >
            {resendLoading
              ? "Đang gửi lại..."
              : resendCooldown > 0
                ? `Gửi lại sau (${resendCooldown}s)`
                : "Chưa nhận được mã? Gửi lại OTP"}
          </button>
        </div>
        <p className="mt-4 text-center text-sm text-gray-600">
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Quay lại Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
