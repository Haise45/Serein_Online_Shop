"use client";

import "@/components/shared/charts/ChartJsDefaults";
import { ORDER_STATUSES } from "@/constants/orderConstants";
import { OrderStatusDistributionItem } from "@/types/dashboard";
import { CCard, CCardBody, CCardHeader, CSpinner } from "@coreui/react";
import React from "react";
import { Doughnut } from "react-chartjs-2";

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
  const chartData = {
    labels:
      data?.map(
        (item) =>
          ORDER_STATUSES.find((s) => s.value === item._id)?.label || item._id,
      ) || [],
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

  return (
    <CCard className="h-100 shadow-sm">
      <CCardHeader>Phân phối trạng thái đơn hàng</CCardHeader>
      <CCardBody className="flex items-center justify-center">
        {isLoading ? (
          <CSpinner />
        ) : (
          <div className="relative h-[300px] w-full">
            <Doughnut
              data={chartData}
              options={{ plugins: { legend: { position: "top" } } }}
            />
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};
export default OrderStatusPieChart;
