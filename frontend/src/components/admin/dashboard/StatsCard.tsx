"use client";

import { formatCurrency } from "@/lib/utils";
import { ExchangeRates } from "@/types"; // Import ExchangeRates
import CIcon from "@coreui/icons-react";
import { CSpinner, CWidgetStatsA } from "@coreui/react";
import React from "react";

interface StatsCardProps {
  icon: string[] | string;
  title: string;
  value: number | undefined;
  isLoading: boolean;
  color: "primary" | "info" | "warning" | "success" | "danger";
  unit?: string;
  isCurrency?: boolean;
  // Thêm props mới
  displayCurrency?: "VND" | "USD";
  rates?: ExchangeRates | null;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  title,
  value,
  isLoading,
  color,
  unit = "",
  isCurrency = false,
  displayCurrency,
  rates,
}) => {
  // *** CẬP NHẬT LOGIC FORMAT ***
  const formattedValue = isCurrency
    ? // Gọi formatCurrency với đầy đủ options
      formatCurrency(value, {
        currency: displayCurrency,
        rates,
        defaultValue: "0",
      })
    : // Nếu không phải tiền tệ, chỉ format số
      value?.toLocaleString("vi-VN") || "0";

  return (
    <CWidgetStatsA
      className="mb-4 shadow-sm"
      color={color}
      value={
        isLoading ? (
          <CSpinner size="sm" className="my-2" />
        ) : (
          <>
            {/* formatCurrency đã bao gồm ký hiệu tiền tệ */}
            {isCurrency ? formattedValue : `${formattedValue} ${unit}`}
          </>
        )
      }
      title={title}
      action={<CIcon icon={icon} height={36} className="text-white/50" />}
    />
  );
};

export default StatsCard;
