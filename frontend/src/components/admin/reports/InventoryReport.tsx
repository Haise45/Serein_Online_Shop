"use client";

import { useGetInventoryReport } from "@/lib/react-query/reportQueries";
import { formatCurrency } from "@/lib/utils";
import { InventoryReportParams } from "@/services/reportService";
import { LowStockProductItem } from "@/types/report";
import { CTableDataCell, CTableRow } from "@coreui/react";
import Image from "next/image";
import Link from "next/link";
import ReportStatCard from "./ReportStatCard";
import ReportTable from "./ReportTable";
import { useGetAttributes } from "@/lib/react-query/attributeQueries";
import { useMemo } from "react";

const InventoryReport: React.FC<{ filters: InventoryReportParams }> = ({
  filters,
}) => {
  const { data, isLoading } = useGetInventoryReport(filters);
  const { data: attributes } = useGetAttributes();

  // *** Lấy attribute map để dịch tên biến thể ***
  const attributeMap = useMemo(() => {
    const map = new Map<
      string,
      { label: string; values: Map<string, string> }
    >();
    if (attributes) {
      attributes.forEach((attr) => {
        const valueMap = new Map<string, string>();
        attr.values.forEach((val) => valueMap.set(val._id, val.value));
        map.set(attr._id, { label: attr.label, values: valueMap });
      });
    }
    return map;
  }, [attributes]);

  // Hàm render một hàng chung cho cả hai bảng
  const renderInventoryRow = (item: LowStockProductItem) => {
    const variantDisplayName = item.variantOptions
      ? item.variantOptions
          .map((opt) => {
            const valueId =
              typeof opt.value === "string" ? opt.value : opt.value._id;
            const attrId =
              typeof opt.attribute === "string"
                ? opt.attribute
                : opt.attribute._id;
            return attributeMap.get(attrId)?.values.get(valueId) || "?";
          })
          .join(" / ")
      : null;

    const displayName = variantDisplayName
      ? `${item.name} (${variantDisplayName})`
      : item.name;

    return (
      <CTableRow key={item._id}>
        <CTableDataCell>
          <Link
            href={`/admin/products/${item.productId}/edit`}
            className="flex items-center gap-3 text-decoration-none"
          >
            <Image
              src={
                item.images && item.images.length > 0
                  ? item.images[0]
                  : "/placeholder-image.jpg"
              }
              alt={displayName}
              width={40}
              height={40}
              quality={100}
              className="aspect-square rounded object-cover object-top"
            />
            <span className="font-medium">{displayName}</span>
          </Link>
        </CTableDataCell>
        <CTableDataCell>
          <code>{item.sku || "N/A"}</code>
        </CTableDataCell>
        <CTableDataCell className="text-center font-bold text-orange-600">
          {item.stockQuantity}
        </CTableDataCell>
      </CTableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <ReportStatCard
          title="Tổng giá trị kho"
          value={formatCurrency(data?.totalInventoryValue)}
          isLoading={isLoading}
        />
        <ReportStatCard
          title="Sản phẩm sắp hết hàng"
          value={data?.lowStockProducts.length || 0}
          isLoading={isLoading}
          description={`(Ngưỡng: ${filters.lowStockThreshold})`}
        />
        <ReportStatCard
          title="Sản phẩm hết hàng"
          value={data?.outOfStockCount || 0}
          isLoading={isLoading}
        />
      </div>

      {/* Bảng sản phẩm sắp hết hàng */}
      <ReportTable
        title="Danh sách Sản phẩm sắp hết hàng"
        isLoading={isLoading}
        items={data?.lowStockProducts || []}
        headers={[
          { key: "product", label: "Sản phẩm" },
          { key: "sku", label: "SKU" },
          { key: "stock", label: "Tồn kho", className: "text-center" },
        ]}
        noDataMessage="Tất cả sản phẩm đều còn hàng trên ngưỡng báo động."
        renderRow={renderInventoryRow}
      />

      {/* Bảng sản phẩm hết hàng */}
      <ReportTable
        title="Danh sách Sản phẩm đã hết hàng"
        isLoading={isLoading}
        items={data?.outOfStockProducts || []}
        headers={[
          { key: "product", label: "Sản phẩm" },
          { key: "sku", label: "SKU" },
          { key: "stock", label: "Tồn kho", className: "text-center" },
        ]}
        noDataMessage="Không có sản phẩm nào hết hàng."
        renderRow={renderInventoryRow}
      />
    </div>
  );
};

export default InventoryReport;
