"use client";

import { useGetCustomerReport } from "@/lib/react-query/reportQueries";
import { formatCurrency, getLocalizedName } from "@/lib/utils";
import { CustomerReportParams } from "@/services/reportService";
import { CustomerReportItem } from "@/types/report";
import { CAvatar, CTableDataCell, CTableRow } from "@coreui/react";
import Link from "next/link";
import ReportStatCard from "./ReportStatCard";
import ReportTable from "./ReportTable";
import { ExchangeRates } from "@/types";
import { useLocale, useTranslations } from "next-intl";

interface CustomerReportProps {
  filters: CustomerReportParams;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

const CustomerReport: React.FC<CustomerReportProps> = ({
  filters,
  displayCurrency,
  rates,
}) => {
  const t = useTranslations("AdminReports.customers");

  const { data, isLoading } = useGetCustomerReport(filters);
  const currencyOptions = { currency: displayCurrency, rates };
  const locale = useLocale() as "vi" | "en";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportStatCard
          title={t("newCustomers")}
          value={data?.newCustomersCount || 0}
          isLoading={isLoading}
          description={t("description")}
        />
      </div>

      <ReportTable
        title={t("topSpenders")}
        isLoading={isLoading}
        items={data?.topSpenders || []}
        headers={[
          { key: "customer", label: t("tableColCustomer") },
          {
            key: "orders",
            label: t("tableColOrders"),
            className: "text-center",
          },
          { key: "spent", label: t("tableColSpent"), className: "text-end" },
        ]}
        // TypeScript sẽ tự động suy ra `item` có kiểu là `CustomerReportItem`
        renderRow={(item: CustomerReportItem) => (
          <CTableRow key={item._id}>
            <CTableDataCell>
              <div className="flex items-center">
                <CAvatar
                  color="secondary"
                  textColor="white"
                  size="md"
                  className="me-3"
                >
                  {getLocalizedName(item.name, locale).charAt(0).toUpperCase()}
                </CAvatar>
                <div>
                  <Link
                    href={`/admin/users/${item._id}`}
                    className="text-decoration-none font-medium hover:underline"
                  >
                    {getLocalizedName(item.name, locale)}
                  </Link>
                  <div className="text-xs text-gray-500">{item.email}</div>
                </div>
              </div>
            </CTableDataCell>
            <CTableDataCell className="text-center font-medium">
              {item.orderCount}
            </CTableDataCell>
            <CTableDataCell className="text-end font-semibold text-green-600">
              {formatCurrency(item.totalSpent, currencyOptions)}
            </CTableDataCell>
          </CTableRow>
        )}
      />
    </div>
  );
};
export default CustomerReport;
