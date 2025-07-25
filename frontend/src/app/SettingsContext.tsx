// app/components/client/SettingsContext.tsx
"use client";

import { getSettingsApi, getExchangeRatesApi } from "@/services/settingService";
import { Setting, ExchangeRates } from "@/types/setting";
import { useQuery } from "@tanstack/react-query";
import React, { createContext, useContext, useState, useEffect } from "react";

// --- Key để lưu vào localStorage ---
const CURRENCY_STORAGE_KEY = "user_preferred_currency";

// Định nghĩa lại giá trị của context
interface SettingsContextValue {
  settings: Setting | null;
  rates: ExchangeRates | null;
  displayCurrency: "VND" | "USD";
  setDisplayCurrency: (currency: "VND" | "USD") => void;
  isLoading: boolean;
  adminDefaultLocale: "vi" | "en";
}

// Khởi tạo context với giá trị mặc định
const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  rates: null,
  displayCurrency: "VND", // Mặc định ban đầu luôn là VND
  setDisplayCurrency: () => {},
  isLoading: true,
  adminDefaultLocale: "vi",
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State quản lý tiền tệ đang hiển thị
  const [displayCurrency, setDisplayCurrencyState] = useState<"VND" | "USD">(
    "VND",
  );

  // Fetch dữ liệu cài đặt
  const { data: settings, isLoading: isLoadingSettings } = useQuery<
    Setting,
    Error
  >({
    queryKey: ["settings"],
    queryFn: getSettingsApi,
    staleTime: Infinity,
  });

  // Fetch dữ liệu tỷ giá
  const { data: rates, isLoading: isLoadingRates } = useQuery<
    ExchangeRates,
    Error
  >({
    queryKey: ["exchangeRates"],
    queryFn: getExchangeRatesApi,
    staleTime: 1000 * 60 * 60, // 1 giờ
  });

  // *** LOGIC MỚI: XỬ LÝ localStorage VÀ GIÁ TRỊ MẶC ĐỊNH ***
  useEffect(() => {
    // Chỉ chạy khi đã có dữ liệu cài đặt từ admin
    if (settings) {
      let preferredCurrency: "VND" | "USD" | null = null;

      // 1. Ưu tiên lấy từ localStorage
      try {
        const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
        if (storedCurrency === "VND" || storedCurrency === "USD") {
          preferredCurrency = storedCurrency;
        }
      } catch (error) {
        console.error("Could not access localStorage:", error);
      }

      // 2. Nếu không có trong localStorage, thì lấy từ cài đặt của admin
      if (!preferredCurrency) {
        preferredCurrency = settings.clientSettings.defaultCurrency;
      }

      // 3. Cập nhật state
      if (preferredCurrency !== displayCurrency) {
        setDisplayCurrencyState(preferredCurrency);
      }
    }
  }, [settings, displayCurrency]);

  // *** Cập nhật state VÀ localStorage ***
  const setDisplayCurrency = (currency: "VND" | "USD") => {
    try {
      // Lưu lựa chọn vào localStorage
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch (error) {
      console.error("Could not write to localStorage:", error);
    }
    // Cập nhật state để giao diện thay đổi ngay lập tức
    setDisplayCurrencyState(currency);
  };

  const isLoading = isLoadingSettings || isLoadingRates;

  const value = {
    settings: settings || null,
    rates: rates || null,
    displayCurrency,
    setDisplayCurrency,
    isLoading,
    adminDefaultLocale: settings?.adminSettings.defaultLanguage || "vi",
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook để sử dụng context
export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
