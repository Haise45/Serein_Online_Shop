"use client";

import { useGetSalesReport } from "@/lib/react-query/reportQueries";
import { formatCurrency } from "@/lib/utils";
import { DateRangeParams } from "@/services/reportService";
import { CTableDataCell, CTableRow } from "@coreui/react";
import ReportStatCard from "./ReportStatCard";
import ReportTable from "./ReportTable";
import SalesByPaymentMethodChart from "./SalesByPaymentMethodChart";
import ReportBlock from "./ReportBlock";

const SalesReport: React.FC<{ filters: DateRangeParams }> = ({ filters }) => {
  const { data, isLoading } = useGetSalesReport(filters);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <ReportStatCard
          title="Tổng Doanh thu"
          value={formatCurrency(data?.summary.totalRevenue)}
          isLoading={isLoading}
        />
        <ReportStatCard
          title="Tổng Đơn hàng"
          value={data?.summary.totalOrders || 0}
          isLoading={isLoading}
        />
        <ReportStatCard
          title="Sản phẩm đã bán"
          value={data?.summary.totalItemsSold || 0}
          isLoading={isLoading}
        />
        <ReportStatCard
          title="Giá trị ĐH Trung bình"
          value={formatCurrency(data?.summary.averageOrderValue)}
          isLoading={isLoading}
        />
      </div>

      <ReportBlock
        title="Doanh thu theo Phương thức Thanh toán"
        renderTable={() => (
          <ReportTable
            isLoading={isLoading}
            items={data?.byPaymentMethod || []}
            headers={[
              { key: "method", label: "Phương thức" },
              { key: "orders", label: "Số đơn", className: "text-center" },
              { key: "value", label: "Tổng giá trị", className: "text-end" },
            ]}
            renderRow={(item) => (
              <CTableRow key={item._id}>
                <CTableDataCell className="font-medium">
                  {{
                    COD: "Thanh toán khi nhận hàng (COD)",
                    BANK_TRANSFER: "Chuyển khoản ngân hàng",
                    PAYPAL: "Thanh toán bằng PayPal",
                  }[item._id] || item._id}
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  {item.count}
                </CTableDataCell>
                <CTableDataCell className="text-end font-semibold">
                  {formatCurrency(item.totalValue)}
                </CTableDataCell>
              </CTableRow>
            )}
          />
        )}
        renderChart={() => (
          <SalesByPaymentMethodChart
            data={data?.byPaymentMethod}
            isLoading={isLoading}
          />
        )}
      />
    </div>
  );
};
export default SalesReport;
