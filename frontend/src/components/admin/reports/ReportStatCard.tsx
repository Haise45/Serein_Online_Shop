"use client";

import { formatCurrency } from "@/lib/utils";
import { ExchangeRates } from "@/types";
import { CSpinner } from "@coreui/react";
import React from "react";

interface ReportStatCardProps {
  title: string;
  value: number | undefined | string; // Chấp nhận cả string cho giá trị đã được định dạng sẵn
  isLoading: boolean;
  description?: string;
  isCurrency?: boolean;
  // Các props tùy chọn để chuyển đổi tiền tệ
  displayCurrency?: "VND" | "USD";
  rates?: ExchangeRates | null;
}

const ReportStatCard: React.FC<ReportStatCardProps> = ({
  title,
  value,
  isLoading,
  description,
  isCurrency = false,
  displayCurrency,
  rates,
}) => {
  // Logic định dạng giá trị
  const formattedValue = () => {
    if (typeof value === "string") {
      // Nếu value đã là string, giả sử nó đã được định dạng sẵn và trả về luôn
      return value;
    }

    if (isCurrency) {
      // Nếu là tiền tệ, gọi hàm formatCurrency với đầy đủ options
      return formatCurrency(value, {
        currency: displayCurrency,
        rates,
        defaultValue: "0",
      });
    }

    // Nếu không phải tiền tệ, chỉ format số
    return value?.toLocaleString("vi-VN") || "0";
  };

  return (
    <div className="h-100 rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-1 text-2xl font-bold text-gray-800">
        {isLoading ? <CSpinner size="sm" /> : formattedValue()}
      </div>
      {description && (
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      )}
    </div>
  );
};

export default ReportStatCard;
