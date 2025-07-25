"use client";

import "@/components/shared/charts/ChartJsDefaults";
import { ChartJsData, ExchangeRates } from "@/types";
import { CCard, CCardBody, CCardHeader, CSpinner } from "@coreui/react";
import { TooltipItem } from "chart.js";
import React from "react";
import { Line } from "react-chartjs-2";
import { useTranslations } from "next-intl";

interface RevenueChartProps {
  data: ChartJsData | undefined;
  isLoading: boolean;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  isLoading,
  displayCurrency,
  rates,
}) => {
  const t = useTranslations("AdminDashboard.revenueChart");

  // 1. Chuyển đổi dữ liệu dataset MỘT LẦN DUY NHẤT ở đây
  const convertedData =
    data?.datasets[0]?.data.map((valueInVND) => {
      if (displayCurrency === "USD" && rates?.rates.USD) {
        return valueInVND * rates.rates.USD;
      }
      return valueInVND;
    }) || [];

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: t("revenueLabel"),
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        data: convertedData, // Sử dụng dữ liệu đã được chuyển đổi
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // 2. Các hàm callback giờ chỉ CÓ NHIỆM VỤ ĐỊNH DẠNG
  const chartOptions = {
    scales: {
      y: {
        ticks: {
          callback: function (value: number | string) {
            const numericValue = Number(value);
            // Chỉ định dạng, không tính toán lại
            if (displayCurrency === "USD") {
              return (
                "$" +
                numericValue.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              );
            }
            // Định dạng cho VND
            if (numericValue >= 1000000)
              return (numericValue / 1000000).toFixed(1) + "tr";
            if (numericValue >= 1000) return numericValue / 1000 + "k";
            return numericValue;
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"line">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            const value = context.parsed.y; // Giá trị này đã được quy đổi
            if (value !== null) {
              if (displayCurrency === "USD") {
                label += value.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                });
              } else {
                label += value.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                });
              }
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <CCard className="h-100 shadow-sm">
      <CCardHeader>{t("title", { currency: displayCurrency })}</CCardHeader>
      <CCardBody>
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center h-100 p-10 text-center">
            <CSpinner />
          </div>
        ) : (
          <div className="relative h-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default RevenueChart;
