"use client";

import "@/components/shared/charts/ChartJsDefaults";
import { ChartJsData } from "@/types/dashboard";
import { CCard, CCardBody, CCardHeader, CSpinner } from "@coreui/react";
import React from "react";
import { Line } from "react-chartjs-2";

interface RevenueChartProps {
  data: ChartJsData | undefined;
  isLoading: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, isLoading }) => {
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: data?.datasets[0].label || "Doanh thu",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        data: data?.datasets[0].data || [],
        fill: true,
        tension: 0,
      },
    ],
  };

  return (
    <CCard className="h-100 shadow-sm">
      <CCardHeader>Biểu đồ doanh thu</CCardHeader>
      <CCardBody>
        {isLoading ? (
          <div className="p-10 text-center">
            <CSpinner />
          </div>
        ) : (
          <div className="relative h-full">
            <Line data={chartData} />
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};
export default RevenueChart;
