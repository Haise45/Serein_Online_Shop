"use client";

import "@/components/shared/charts/ChartJsDefaults";
import { formatCurrency } from "@/lib/utils";
import { ExchangeRates } from "@/types";
import { SalesByPaymentMethod } from "@/types/report";
import { CSpinner } from "@coreui/react";
import { TooltipItem } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTranslations } from "next-intl";

interface SalesByPaymentMethodChartProps {
  data?: SalesByPaymentMethod[];
  isLoading: boolean;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

const SalesByPaymentMethodChart: React.FC<SalesByPaymentMethodChartProps> = ({
  data,
  isLoading,
  displayCurrency,
  rates,
}) => {
  const t = useTranslations("AdminReports.sales");
  const tPayment = useTranslations("CheckoutForm.paymentMethods");

  const chartData = {
    labels: data?.map((d) => tPayment(`${d._id}.name`)) || [],
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
              const originalValueVND =
                data?.[context.dataIndex]?.totalValue || 0;
              return `${label}: ${formatCurrency(originalValueVND, { currency: displayCurrency, rates })}`;
            }
            return label;
          },
          afterLabel: function (context: TooltipItem<"doughnut">) {
            // Lấy ra số lượng đơn hàng tương ứng với lát cắt này
            const orderCount = data?.[context.dataIndex]?.count || 0;
            return t("chartTooltipOrders", { count: orderCount });
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
