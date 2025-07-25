"use client";

import { useGetInventoryReport } from "@/lib/react-query/reportQueries";
import { formatCurrency, getLocalizedName } from "@/lib/utils";
import { InventoryReportParams } from "@/services/reportService";
import { LowStockProductItem } from "@/types/report";
import { CTableDataCell, CTableRow } from "@coreui/react";
import Image from "next/image";
import Link from "next/link";
import ReportStatCard from "./ReportStatCard";
import ReportTable from "./ReportTable";
import { useGetAttributes } from "@/lib/react-query/attributeQueries";
import { useMemo } from "react";
import { ExchangeRates } from "@/types";
import { useLocale, useTranslations } from "next-intl";

interface InventoryReportProps {
  filters: InventoryReportParams;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

const InventoryReport: React.FC<InventoryReportProps> = ({
  filters,
  displayCurrency,
  rates,
}) => {
  const t = useTranslations("AdminReports.inventory");
  const locale = useLocale() as "vi" | "en";
  const { data, isLoading } = useGetInventoryReport(filters);
  const currencyOptions = { currency: displayCurrency, rates };
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
      ? `${getLocalizedName(item.name, locale)} (${variantDisplayName})`
      : getLocalizedName(item.name, locale);

    return (
      <CTableRow key={item._id}>
        <CTableDataCell>
          <Link
            href={`/admin/products/${item.productId}/edit`}
            className="text-decoration-none flex items-center gap-3"
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
          title={t("totalValue")}
          value={formatCurrency(data?.totalInventoryValue, currencyOptions)}
          isLoading={isLoading}
        />
        <ReportStatCard
          title={t("lowStock")}
          value={data?.lowStockProducts.length || 0}
          isLoading={isLoading}
          description={t("lowStockThreshold", {
            count: filters.lowStockThreshold ?? 0,
          })}
        />
        <ReportStatCard
          title={t("outOfStock")}
          value={data?.outOfStockCount || 0}
          isLoading={isLoading}
        />
      </div>

      {/* Bảng sản phẩm sắp hết hàng */}
      <ReportTable
        title={t("listLowStock")}
        isLoading={isLoading}
        items={data?.lowStockProducts || []}
        headers={[
          { key: "product", label: t("tableColProduct") },
          { key: "sku", label: t("tableColSku") },
          { key: "stock", label: t("tableColStock"), className: "text-center" },
        ]}
        noDataMessage={t("noLowStock")}
        renderRow={renderInventoryRow}
      />

      {/* Bảng sản phẩm hết hàng */}
      <ReportTable
        title={t("listOutOfStock")}
        isLoading={isLoading}
        items={data?.outOfStockProducts || []}
        headers={[
          { key: "product", label: t("tableColProduct") },
          { key: "sku", label: t("tableColSku") },
          { key: "stock", label: t("tableColStock"), className: "text-center" },
        ]}
        noDataMessage={t("noOutOfStock")}
        renderRow={renderInventoryRow}
      />
    </div>
  );
};

export default InventoryReport;
