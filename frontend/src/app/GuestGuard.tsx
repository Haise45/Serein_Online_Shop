"use client";

import { RootState } from "@/store";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

// Tạo một component LoadingScreen riêng để tái sử dụng
function RedirectingScreen() {
  const t = useTranslations("GuestGuard");

  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 p-5 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      <p className="mt-4 text-lg font-medium text-gray-700">
        {t("redirectingTitle")}
      </p>
      <p className="text-sm text-gray-500">{t("redirectingSubtitle")}</p>
    </div>
  );
}

interface GuestGuardProps {
  children: React.ReactNode;
}

const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Logic chuyển hướng vẫn giữ nguyên
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Nếu user đã đăng nhập, hiển thị một màn hình loading/chuyển hướng
  if (isAuthenticated) {
    return <RedirectingScreen />;
  }

  // Nếu không đăng nhập, hiển thị nội dung của trang (form login/register).
  return <>{children}</>;
};

export default GuestGuard;
