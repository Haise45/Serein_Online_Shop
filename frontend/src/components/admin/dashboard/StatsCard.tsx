"use client";

import { formatCurrency } from "@/lib/utils";
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
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  title,
  value,
  isLoading,
  color,
  unit = "",
  isCurrency = false,
}) => {
  const formattedValue = isCurrency
    ? formatCurrency(value, false) // Không hiển thị ký hiệu 'đ' để gọn hơn
    : value?.toLocaleString("vi-VN") || "0";

  return (
    <CWidgetStatsA
      className="mb-4 shadow-sm"
      color={color}
      value={
        isLoading ? (
          <CSpinner size="sm" className="my-2" />
        ) : (
          <>
            {formattedValue}
            {unit && <span className="ms-2 font-normal">{unit}</span>}
          </>
        )
      }
      title={title}
      action={<CIcon icon={icon} height={36} className="text-white/50" />}
    />
  );
};

export default StatsCard;
