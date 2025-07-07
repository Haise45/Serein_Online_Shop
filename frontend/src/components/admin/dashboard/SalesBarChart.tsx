"use client";

import { useSettings } from "@/app/SettingsContext";
import "@/components/shared/charts/ChartJsDefaults";
import { formatCurrency } from "@/lib/utils";
import { ChartJsData } from "@/types/dashboard";
import { CCard, CCardBody, CSpinner } from "@coreui/react";
import { TooltipItem } from "chart.js";
import React from "react";
import { Bar } from "react-chartjs-2";

interface SalesBarChartProps {
  data: ChartJsData | undefined;
  isLoading: boolean;
  mode: "orders" | "products" | "revenue";
}

const SalesBarChart: React.FC<SalesBarChartProps> = ({
  data,
  isLoading,
  mode,
}) => {
  const settingsContext = useSettings();
  const displayCurrency = settingsContext?.displayCurrency;
  const rates = settingsContext?.rates;

  const chartConfig = {
    orders: {
      label: "Số đơn hàng",
      backgroundColor: "rgba(54, 162, 235, 0.6)",
    },
    products: {
      label: "Số sản phẩm đã bán",
      backgroundColor: "rgba(75, 192, 192, 0.6)",
    },
    revenue: { label: "Doanh thu", backgroundColor: "rgba(255, 159, 64, 0.6)" },
  };

  const currentConfig = chartConfig[mode];
  const currentDataset = data?.datasets.find(
    (ds) => ds.label === currentConfig.label,
  );

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: currentConfig.label,
        backgroundColor: currentConfig.backgroundColor,
        data: currentDataset?.data || [],
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Tùy chỉnh tick cho trục Y
          callback: function (value: string | number) {
            const numericValue = Number(value);
            if (mode === "revenue") {
              if (numericValue >= 1000000) return numericValue / 1000000 + "tr";
              if (numericValue >= 1000) return numericValue / 1000 + "k";
            }
            if (Number.isInteger(numericValue)) return numericValue; // Chỉ hiển thị số nguyên
            return null;
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          // Tùy chỉnh tooltip
          label: function (context: TooltipItem<"bar">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            const value = context.parsed.y;
            if (value !== null) {
              if (mode === "revenue") {
                label += formatCurrency(value, {
                  currency: displayCurrency,
                  rates,
                });
              } else {
                label += value.toLocaleString("vi-VN");
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
      <CCardBody>
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <CSpinner />
          </div>
        ) : (
          <div className="relative h-[300px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};
export default SalesBarChart;
