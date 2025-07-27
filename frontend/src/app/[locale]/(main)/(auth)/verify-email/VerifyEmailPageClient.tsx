"use client";

import GuestGuard from "@/app/GuestGuard";
import { Link, useRouter } from "@/i18n/navigation";
import {
  resendVerificationEmail,
  verifyEmailOTP,
} from "@/services/authService";
import { AppDispatch } from "@/store";
import { loginSuccess } from "@/store/slices/authSlice";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailPage() {
  const t = useTranslations("VerifyEmailPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]); // Mảng 6 ký tự
  const [emailFromQuery, setEmailFromQuery] = useState<string>("");
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string>("/");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    const email = searchParams.get("email");
    const message = searchParams.get("message");
    const redirect = searchParams.get("redirect");

    if (email) {
      setEmailFromQuery(email);
    } else {
      // Nếu không có email, có thể redirect về register hoặc login
      // router.replace('/register');
      setError(t("missingEmailError"));
    }
    if (message) {
      setInitialMessage(decodeURIComponent(message));
    }
    if (redirect && redirect.startsWith("/")) {
      try {
        setRedirectUrl(decodeURIComponent(redirect));
      } catch {
        setRedirectUrl("/");
      }
    } else if (redirect) {
      setRedirectUrl("/");
    }
  }, [searchParams, t]);

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
    if (/^[0-9]*$/.test(value) && value.length <= 1) {
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

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      // Nếu ô hiện tại rỗng và nhấn Backspace, chuyển về ô trước
      const currentInput = e.target as HTMLInputElement;
      const previousSibling =
        currentInput.previousElementSibling as HTMLInputElement | null;
      previousSibling?.focus();
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

    if (!emailFromQuery) {
      setError(t("missingEmailError"));
      return;
    }
    if (enteredOtp.length !== 6) {
      setError(t("invalidOtpError"));
      return;
    }

    setLoading(true);
    try {
      const data = await verifyEmailOTP({
        email: emailFromQuery,
        otp: enteredOtp,
      });
      setSuccessMessage(data.message || t("successMessage"));
      setOtp(["", "", "", "", "", ""]);

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
      toast.success(t("successMessage"));

      // Chuyển hướng sau khi thành công
      setTimeout(() => {
        // Ưu tiên redirectUrl đã lấy từ query param
        const finalRedirect =
          redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : "/";
        if (data.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push(finalRedirect);
        }
      }, 2000); // Đợi 2s để user đọc message
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message || error.message || t("failureMessage");
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
      setSuccessMessage(data.message || t("resendSuccessMessage"));
      setResendCooldown(RESEND_COOLDOWN_SECONDS); // Bắt đầu đếm ngược
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("resendFailureMessage");
      setError(errorMessage);
      console.error("Resend OTP failed:", err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <GuestGuard>
      <div className="flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-xl bg-white px-6 py-8 shadow-xl sm:p-10">
          <h1 className="mb-4 text-center text-3xl font-bold text-gray-800">
            {t("title")}
          </h1>
          {initialMessage && (
            <p className="mb-4 rounded-md bg-green-50 p-3 text-center text-sm text-green-600">
              {initialMessage}
            </p>
          )}
          <p className="mb-6 text-center text-sm text-gray-600">
            {t.rich("initialMessage", {
              email: emailFromQuery || t("defaultEmail"),
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
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

            <div
              className="flex justify-center space-x-1.5 sm:space-x-2"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  className="h-12 w-9 rounded-md border border-gray-300 text-center text-2xl font-semibold shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:h-14 sm:w-12"
                  disabled={loading}
                  aria-label={t("otpInputLabel", { index: index + 1 })}
                />
              ))}
            </div>

            <div>
              <button
                className={`flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none ${loading ? "cursor-not-allowed bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                type="submit"
                disabled={loading || otp.join("").length !== 6}
              >
                {loading ? t("submitButtonLoading") : t("submitButton")}
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
                ? t("resendButtonLoading")
                : resendCooldown > 0
                  ? t("resendButtonCooldown", { seconds: resendCooldown })
                  : t("resendButton")}
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {t("backToLoginLink")}
            </Link>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
