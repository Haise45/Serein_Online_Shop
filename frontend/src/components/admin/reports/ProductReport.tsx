"use client";

import { useGetProductReport } from "@/lib/react-query/reportQueries";
import ReportTable from "./ReportTable";
import { ProductReportParams } from "@/services/reportService";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { CTableRow, CTableDataCell } from "@coreui/react";
import ReportBlock from "./ReportBlock";
import TopProductsChart from "./TopProductsChart";
import { ExchangeRates } from "@/types";

interface ProductReportProps {
  filters: ProductReportParams;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

const ProductReport: React.FC<ProductReportProps> = ({
  filters,
  displayCurrency,
  rates,
}) => {
  const { data, isLoading } = useGetProductReport(filters);
  const currencyOptions = { currency: displayCurrency, rates };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ReportBlock
        title="Top Sản phẩm Bán chạy (Số lượng)"
        renderTable={() => (
          <ReportTable
            isLoading={isLoading}
            items={data?.topByQuantity || []}
            headers={[
              { key: "product", label: "Sản phẩm" },
              { key: "sold", label: "Đã bán", className: "text-center" },
            ]}
            renderRow={(item) => (
              <CTableRow key={item._id}>
                <CTableDataCell>
                  <Link
                    href={`/admin/products/${item._id}/edit`}
                    className="text-decoration-none flex items-center gap-3"
                  >
                    <Image
                      src={item.image || "/placeholder-image.jpg"}
                      alt={item.name}
                      width={40}
                      height={40}
                      quality={100}
                      className="aspect-square rounded object-cover object-top"
                    />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </CTableDataCell>
                <CTableDataCell className="text-center font-bold">
                  {item.totalSold}
                </CTableDataCell>
              </CTableRow>
            )}
          />
        )}
        renderChart={() => (
          <TopProductsChart
            data={data?.topByQuantity}
            isLoading={isLoading}
            dataKey="totalSold"
          />
        )}
      />
      <ReportBlock
        title="Top Sản phẩm Doanh thu Cao"
        renderTable={() => (
          <ReportTable
            title=""
            isLoading={isLoading}
            items={data?.topByRevenue || []}
            headers={[
              { key: "product", label: "Sản phẩm" },
              { key: "revenue", label: "Doanh thu", className: "text-end" },
            ]}
            renderRow={(item) => (
              <CTableRow key={item._id}>
                <CTableDataCell>
                  <Link
                    href={`/admin/products/${item._id}/edit`}
                    className="text-decoration-none flex items-center gap-3"
                  >
                    <Image
                      src={item.image || "/placeholder-image.jpg"}
                      alt={item.name}
                      width={40}
                      height={40}
                      quality={100}
                      className="aspect-square rounded object-cover object-top"
                    />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </CTableDataCell>
                <CTableDataCell className="text-end font-semibold text-green-600">
                  {formatCurrency(item.revenue, currencyOptions)}
                </CTableDataCell>
              </CTableRow>
            )}
          />
        )}
        renderChart={() => (
          <TopProductsChart
            data={data?.topByRevenue}
            isLoading={isLoading}
            dataKey="revenue"
            displayCurrency={displayCurrency}
            rates={rates}
          />
        )}
      />
    </div>
  );
};
export default ProductReport;
