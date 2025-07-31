"use client";
import "@/components/shared/charts/ChartJsDefaults";
import { formatCurrency } from "@/lib/utils";
import { ExchangeRates } from "@/types";
import { ProductReportItem } from "@/types/report";
import { CSpinner } from "@coreui/react";
import { TooltipItem } from "chart.js";
import { Bar } from "react-chartjs-2";
import { useTranslations } from "next-intl"; // Sửa lại import
import { useLocale } from "next-intl"; // Sửa lại import
import { getLocalizedName } from "@/lib/utils"; // Import hàm tiện ích

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
  const t = useTranslations("AdminReports.products");
  const locale = useLocale() as "vi" | "en";

  // *** THAY ĐỔI CỐT LÕI BẮT ĐẦU TỪ ĐÂY ***

  // 1. Chuyển đổi dữ liệu trước khi render nếu là USD và dataKey là revenue
  const convertedDatasetData =
    data?.map((p) => {
      const value = p[dataKey] || 0;
      if (
        dataKey === "revenue" &&
        displayCurrency === "USD" &&
        rates?.rates.USD
      ) {
        return value * rates.rates.USD;
      }
      return value;
    }) || [];

  const chartData = {
    labels:
      data?.map(
        (p) => getLocalizedName(p.name, locale).substring(0, 20) + "...",
      ) || [],
    datasets: [
      {
        label:
          dataKey === "totalSold"
            ? t("chartLabelQuantity")
            : t("chartLabelRevenue"),
        data: convertedDatasetData, // Sử dụng dữ liệu đã được chuyển đổi
        backgroundColor:
          dataKey === "totalSold"
            ? "rgba(75, 192, 192, 0.7)"
            : "rgba(54, 162, 235, 0.7)",
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y" as const,
    scales: {
      // 2. Thêm logic định dạng cho trục x
      x: {
        ticks: {
          callback: function (value: string | number) {
            const numericValue = Number(value);
            // Chỉ định dạng nếu là biểu đồ doanh thu
            if (dataKey === "revenue") {
              if (displayCurrency === "USD") {
                return "$" + numericValue.toLocaleString("en-US");
              }
              // Định dạng cho VND
              if (numericValue >= 1000000) return numericValue / 1000000 + "tr";
              if (numericValue >= 1000) return numericValue / 1000 + "k";
            }
            // Mặc định trả về giá trị số lượng
            return numericValue;
          },
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"bar">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            const value = context.parsed.x; // Giá trị này đã được chuyển đổi
            if (value !== null) {
              if (dataKey === "revenue") {
                // Tooltip vẫn cần format lại đầy đủ
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
