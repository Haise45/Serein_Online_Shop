"use client";

import { useGetCustomerReport } from "@/lib/react-query/reportQueries";
import { formatCurrency } from "@/lib/utils";
import { CustomerReportParams } from "@/services/reportService";
import { CustomerReportItem } from "@/types/report";
import { CAvatar, CTableDataCell, CTableRow } from "@coreui/react";
import Link from "next/link";
import ReportStatCard from "./ReportStatCard";
import ReportTable from "./ReportTable";
import { ExchangeRates } from "@/types";

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
  const { data, isLoading } = useGetCustomerReport(filters);
  const currencyOptions = { currency: displayCurrency, rates };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportStatCard
          title="Khách hàng mới"
          value={data?.newCustomersCount || 0}
          isLoading={isLoading}
          description="Trong khoảng thời gian đã chọn"
        />
      </div>

      <ReportTable
        title="Top Khách hàng Chi tiêu nhiều nhất"
        isLoading={isLoading}
        items={data?.topSpenders || []}
        headers={[
          { key: "customer", label: "Khách hàng" },
          { key: "orders", label: "Số đơn hàng", className: "text-center" },
          { key: "spent", label: "Tổng chi tiêu", className: "text-end" },
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
                  {item.name.charAt(0).toUpperCase()}
                </CAvatar>
                <div>
                  <Link
                    href={`/admin/users/${item._id}`}
                    className="text-decoration-none font-medium hover:underline"
                  >
                    {item.name}
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
