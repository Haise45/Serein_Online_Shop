"use client";
import "@/components/shared/charts/ChartJsDefaults";
import { formatCurrency } from "@/lib/utils";
import { ExchangeRates } from "@/types";
import { ProductReportItem } from "@/types/report";
import { CSpinner } from "@coreui/react";
import { TooltipItem } from "chart.js";
import { Bar } from "react-chartjs-2";

interface TopProductsChartProps {
  data?: ProductReportItem[];
  isLoading: boolean;
  dataKey: "totalSold" | "revenue";
  displayCurrency?: "VND" | "USD";
  rates?: ExchangeRates | null;
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({
  data,
  isLoading,
  dataKey,
  displayCurrency,
  rates,
}) => {
  const chartData = {
    labels: data?.map((p) => p.name.substring(0, 20) + "...") || [],
    datasets: [
      {
        label: dataKey === "totalSold" ? "Số lượng đã bán" : "Doanh thu",
        data: data?.map((p) => p[dataKey] || 0) || [],
        backgroundColor:
          dataKey === "totalSold"
            ? "rgba(75, 192, 192, 0.7)"
            : "rgba(54, 162, 235, 0.7)",
      },
    ],
  };

  // *** TÙY CHỈNH TOOLTIP CHO BIỂU ĐỒ NÀY ***
  const chartOptions = {
    indexAxis: "y" as const,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"bar">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            const value = context.parsed.x; // Lấy giá trị từ trục x cho biểu đồ cột ngang
            if (value !== null) {
              if (dataKey === "revenue") {
                label += formatCurrency(value, {
                  currency: displayCurrency,
                  rates,
                });
              } else {
                label += value;
              }
            }
            return label;
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
    <div className="relative h-[400px]">
      <Bar data={chartData} options={chartOptions} />
    </div>
  ); // Biểu đồ cột ngang
};
export default TopProductsChart;
