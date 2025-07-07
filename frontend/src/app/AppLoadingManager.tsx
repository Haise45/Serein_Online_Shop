"use client";

import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { useSettings } from "./SettingsContext";
import React from "react";
import { useTranslations } from "next-intl";

function LoadingScreen() {
  const t = useTranslations("AppLoadingManager");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-white text-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-700 border-t-transparent" />
      <p className="mt-4 animate-pulse text-xl font-medium text-gray-800">
        {t("loadingMessage")}
      </p>
    </div>
  );
}

export default function AppLoadingManager({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lấy trạng thái tải từ SettingsContext
  const { isLoading: isSettingsLoading } = useSettings();
  // Lấy trạng thái khởi tạo từ Auth hook
  const { isAuthInitializing } = useAuthInitializer();

  // Hiển thị màn hình tải nếu MỘT TRONG HAI quá trình chưa hoàn tất
  if (isSettingsLoading || isAuthInitializing) {
    return <LoadingScreen />;
  }

  // Khi tất cả đã sẵn sàng, hiển thị nội dung chính
  return <>{children}</>;
}
