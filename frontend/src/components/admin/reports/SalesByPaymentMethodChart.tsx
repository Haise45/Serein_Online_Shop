"use client";
import "@/components/shared/charts/ChartJsDefaults";
import { formatCurrency } from "@/lib/utils";
import { SalesByPaymentMethod } from "@/types/report";
import { CSpinner } from "@coreui/react";
import { TooltipItem } from "chart.js";
import { Doughnut } from "react-chartjs-2";

const SalesByPaymentMethodChart: React.FC<{
  data?: SalesByPaymentMethod[];
  isLoading: boolean;
}> = ({ data, isLoading }) => {
  const chartData = {
    labels: data?.map((d) => d._id) || [],
    datasets: [
      {
        data: data?.map((d) => d.totalValue) || [],
        backgroundColor: ["#4BC0C0", "#FF6384", "#FFCE56", "#36A2EB"],
      },
    ],
  };

  const chartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          // Dùng callback `footer` hoặc tùy chỉnh `label`
          label: function (context: TooltipItem<"doughnut">) {
            const label = context.label || "";
            const value = context.parsed; // Giá trị số
            if (value !== null) {
              return `${label}: ${formatCurrency(value)}`;
            }
            return label;
          },
          afterLabel: function (context: TooltipItem<"doughnut">) {
            // Lấy ra số lượng đơn hàng tương ứng với lát cắt này
            const orderCount = data?.[context.dataIndex]?.count || 0;
            return `Số đơn hàng: ${orderCount}`;
          },
        },
      },
    },
  };

  if (isLoading)
    return (
      <div className="p-5 text-center">
        <CSpinner />
      </div>
    );
  return (
    <div className="relative h-[350px]">
      <Doughnut data={chartData} options={chartOptions} />
    </div>
  );
};
export default SalesByPaymentMethodChart;
