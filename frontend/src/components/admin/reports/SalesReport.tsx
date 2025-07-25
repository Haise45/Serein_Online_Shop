"use client";

import { useGetSalesReport } from "@/lib/react-query/reportQueries";
import { formatCurrency } from "@/lib/utils";
import { DateRangeParams } from "@/services/reportService";
import { CTableDataCell, CTableRow } from "@coreui/react";
import ReportStatCard from "./ReportStatCard";
import ReportTable from "./ReportTable";
import SalesByPaymentMethodChart from "./SalesByPaymentMethodChart";
import ReportBlock from "./ReportBlock";
import { ExchangeRates } from "@/types";
import { useTranslations } from "next-intl";

interface SalesReportProps {
  filters: DateRangeParams;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

const SalesReport: React.FC<SalesReportProps> = ({
  filters,
  displayCurrency,
  rates,
}) => {
  const t = useTranslations("AdminReports.sales");
  const tPayment = useTranslations("CheckoutForm.paymentMethods");
  const { data, isLoading } = useGetSalesReport(filters);
  const currencyOptions = { currency: displayCurrency, rates };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <ReportStatCard
          title={t("totalRevenue")}
          value={formatCurrency(data?.summary.totalRevenue, currencyOptions)}
          isLoading={isLoading}
        />
        <ReportStatCard
          title={t("totalOrders")}
          value={data?.summary.totalOrders || 0}
          isLoading={isLoading}
        />
        <ReportStatCard
          title={t("itemsSold")}
          value={data?.summary.totalItemsSold || 0}
          isLoading={isLoading}
        />
        <ReportStatCard
          title={t("avgOrderValue")}
          value={formatCurrency(
            data?.summary.averageOrderValue,
            currencyOptions,
          )}
          isLoading={isLoading}
        />
      </div>

      <ReportBlock
        title={t("revenueByPayment")}
        renderTable={() => (
          <ReportTable
            isLoading={isLoading}
            items={data?.byPaymentMethod || []}
            headers={[
              { key: "method", label: t("tableColMethod") },
              {
                key: "orders",
                label: t("tableColOrders"),
                className: "text-center",
              },
              {
                key: "value",
                label: t("tableColValue"),
                className: "text-end",
              },
            ]}
            renderRow={(item) => (
              <CTableRow key={item._id}>
                <CTableDataCell className="font-medium">
                  {tPayment(`${item._id}.name`)}
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  {item.count}
                </CTableDataCell>
                <CTableDataCell className="text-end font-semibold">
                  {formatCurrency(item.totalValue, currencyOptions)}
                </CTableDataCell>
              </CTableRow>
            )}
          />
        )}
        renderChart={() => (
          <SalesByPaymentMethodChart
            data={data?.byPaymentMethod}
            isLoading={isLoading}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        )}
      />
    </div>
  );
};
export default SalesReport;
