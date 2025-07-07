"use client";

import { useSettings } from "@/app/SettingsContext";
import DateRangeFilter from "@/components/admin/dashboard/DateRangeFilter";
import CustomerReport from "@/components/admin/reports/CustomerReport";
import InventoryReport from "@/components/admin/reports/InventoryReport";
import ProductReport from "@/components/admin/reports/ProductReport";
import SalesReport from "@/components/admin/reports/SalesReport";
import { CNav, CNavItem, CNavLink, CTabContent, CTabPane } from "@coreui/react";
import { format, sub } from "date-fns";
import { useState } from "react";

export default function AdminReportsClient() {
  const [dateRange, setDateRange] = useState({
    startDate: format(sub(new Date(), { days: 29 }), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  const [activeKey, setActiveKey] = useState(1);

  // *** LẤY THÔNG TIN TIỀN TỆ TỪ CONTEXT ***
  const { displayCurrency, rates } = useSettings();

  const commonReportProps = {
    filters: { ...dateRange, limit: 10 },
    displayCurrency: displayCurrency,
    rates: rates,
  };

  return (
    <div className="mb-6 space-y-6">
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <CNav variant="tabs" role="tablist" className="mb-0">
        <CNavItem role="presentation" className="cursor-pointer">
          <CNavLink active={activeKey === 1} onClick={() => setActiveKey(1)}>
            Bán hàng
          </CNavLink>
        </CNavItem>
        <CNavItem role="presentation" className="cursor-pointer">
          <CNavLink active={activeKey === 2} onClick={() => setActiveKey(2)}>
            Sản phẩm
          </CNavLink>
        </CNavItem>
        <CNavItem role="presentation" className="cursor-pointer">
          <CNavLink active={activeKey === 3} onClick={() => setActiveKey(3)}>
            Khách hàng
          </CNavLink>
        </CNavItem>
        <CNavItem role="presentation" className="cursor-pointer">
          <CNavLink active={activeKey === 4} onClick={() => setActiveKey(4)}>
            Tồn kho
          </CNavLink>
        </CNavItem>
      </CNav>

      <CTabContent>
        <CTabPane
          role="tabpanel"
          aria-labelledby="sales-tab"
          visible={activeKey === 1}
        >
          <SalesReport {...commonReportProps} />
        </CTabPane>
        <CTabPane
          role="tabpanel"
          aria-labelledby="products-tab"
          visible={activeKey === 2}
        >
          <ProductReport {...commonReportProps} />
        </CTabPane>
        <CTabPane
          role="tabpanel"
          aria-labelledby="customers-tab"
          visible={activeKey === 3}
        >
          <CustomerReport {...commonReportProps} />
        </CTabPane>
        <CTabPane
          role="tabpanel"
          aria-labelledby="inventory-tab"
          visible={activeKey === 4}
        >
          <InventoryReport
            filters={{ lowStockThreshold: 10 }}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </CTabPane>
      </CTabContent>
    </div>
  );
}
