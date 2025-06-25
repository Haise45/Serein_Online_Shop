"use client";

import "@/components/shared/charts/ChartJsDefaults";
import { ChartJsData } from "@/types/dashboard";
import { CCard, CCardBody, CSpinner } from "@coreui/react";
import React from "react";
import { Bar } from "react-chartjs-2";

interface SalesBarChartProps {
  data: ChartJsData | undefined;
  isLoading: boolean;
  mode: "orders" | "products";
}

const SalesBarChart: React.FC<SalesBarChartProps> = ({
  data,
  isLoading,
  mode,
}) => {
  const chartConfig = {
    orders: {
      label: "Số đơn hàng",
      backgroundColor: "rgba(54, 162, 235, 0.6)",
      borderColor: "rgba(54, 162, 235, 1)",
    },
    products: {
      label: "Số sản phẩm đã bán",
      backgroundColor: "rgba(75, 192, 192, 0.6)",
      borderColor: "rgba(75, 192, 192, 1)",
    },
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
        borderColor: currentConfig.borderColor,
        borderWidth: 1,
        data: currentDataset?.data || [],
      },
    ],
  };

  return (
    <CCard className="h-100 shadow-sm">
      {/* Header sẽ được quản lý ở component cha */}
      <CCardBody>
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <CSpinner />
          </div>
        ) : (
          <div className="relative h-full">
            <Bar
              data={chartData}
              options={{ scales: { y: { ticks: { stepSize: 1 } } } }}
            />
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};
export default SalesBarChart;
