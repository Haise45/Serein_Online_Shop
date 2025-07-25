"use client";

import "@/components/shared/charts/ChartJsDefaults";
import { ChartJsData } from "@/types/dashboard";
import { CCard, CCardBody, CSpinner } from "@coreui/react";
import { TooltipItem } from "chart.js";
import React from "react";
import { Bar } from "react-chartjs-2";
import { useTranslations } from "next-intl";

interface SalesBarChartProps {
  data: ChartJsData | undefined;
  isLoading: boolean;
  mode: "orders" | "products";
}

const API_DATASET_LABELS = {
  orders: "Số đơn hàng",
  products: "Số sản phẩm đã bán",
};


const SalesBarChart: React.FC<SalesBarChartProps> = ({
  data,
  isLoading,
  mode,
}) => {
  const t = useTranslations("AdminDashboard.quantityChart");

  const chartConfig = {
    orders: {
      label: t("ordersLabel"),
      backgroundColor: "rgba(54, 162, 235, 0.6)",
    },
    products: {
      label: t("productsLabel"),
      backgroundColor: "rgba(75, 192, 192, 0.6)",
    },
  };

  const currentConfig = chartConfig[mode];
  const currentDataset = data?.datasets.find(
    (ds) => ds.label === API_DATASET_LABELS[mode],
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
              label += value.toLocaleString("vi-VN");
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
