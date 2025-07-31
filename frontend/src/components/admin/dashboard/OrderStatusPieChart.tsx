"use client";

import "@/components/shared/charts/ChartJsDefaults";
import { OrderStatusDistributionItem } from "@/types/dashboard";
import { CCard, CCardBody, CCardHeader, CSpinner } from "@coreui/react";
import { TooltipItem } from "chart.js";
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { useTranslations } from "next-intl";

interface OrderStatusPieChartProps {
  data: OrderStatusDistributionItem[] | undefined;
  isLoading: boolean;
}

const statusColors: Record<string, string> = {
  Pending: "#6c757d",
  Processing: "#0dcaf0",
  Shipped: "#0d6efd",
  Delivered: "#198754",
  Cancelled: "#212529",
  Refunded: "#ffc107",
  CancellationRequested: "#fd7e14",
  RefundRequested: "#dc3545",
};

const OrderStatusPieChart: React.FC<OrderStatusPieChartProps> = ({
  data,
  isLoading,
}) => {
  const t = useTranslations("AdminDashboard.orderStatusChart");
  const tStatus = useTranslations("OrderStatus");

  const chartData = {
    labels: data?.map((item) => tStatus(item._id)) || [],
    datasets: [
      {
        data: data?.map((item) => item.count) || [],
        backgroundColor:
          data?.map((item) => statusColors[item._id] || "#cccccc") || [],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  // *** TÙY CHỈNH TOOLTIP RIÊNG CHO BIỂU ĐỒ NÀY ***
  const chartOptions = {
    plugins: {
      legend: {
        position: "top" as const, // Thêm 'as const'
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"doughnut">) {
            const label = context.label || "";
            const value = context.parsed;
            return t("tooltipLabel", { label, value });
          },
        },
      },
    },
  };

  return (
    <CCard className="h-100 shadow-sm">
      <CCardHeader>{t("title")}</CCardHeader>
      <CCardBody className="flex items-center justify-center">
        {isLoading ? (
          <CSpinner />
        ) : !data || data.length === 0 ? (
          <p className="text-gray-500">{t("noData")}</p>
        ) : (
          <div className="relative h-[300px] w-full">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};
export default OrderStatusPieChart;
