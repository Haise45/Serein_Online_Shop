"use client";

import DateRangeFilter from "@/components/admin/dashboard/DateRangeFilter";
import SalesBarChart from "@/components/admin/dashboard/SalesBarChart";
import OrderStatusPieChart from "@/components/admin/dashboard/OrderStatusPieChart";
import RevenueChart from "@/components/admin/dashboard/RevenueChart";
import StatsCard from "@/components/admin/dashboard/StatsCard";
import TopProductsTable from "@/components/admin/dashboard/TopProductsTable";
import {
  useGetDashboardStats,
  useGetOrderStatusDistribution,
  useGetRevenueChartData,
  useGetTopProducts,
} from "@/lib/react-query/dashboardQueries";
import { cilBasket, cilChartPie, cilMoney, cilPeople } from "@coreui/icons";
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
} from "@coreui/react";
import { format, sub } from "date-fns";
import { useState } from "react";
import { useSettings } from "@/app/SettingsContext";
import { useTranslations } from "next-intl";

export default function AdminDashboardClient() {
  // *** LẤY THÔNG TIN TIỀN TỆ TỪ CONTEXT ***
  const { displayCurrency, rates } = useSettings();
  const t = useTranslations("AdminDashboard");

  const [dateRange, setDateRange] = useState({
    // Mặc định lọc 7 ngày qua
    startDate: format(sub(new Date(), { days: 6 }), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [barChartMode, setBarChartMode] = useState<"orders" | "products">(
    "orders",
  );

  const { data: statsData, isLoading: isLoadingStats } =
    useGetDashboardStats(dateRange);
  const { data: revenueData, isLoading: isLoadingRevenue } =
    useGetRevenueChartData({ ...dateRange, groupBy: "day" });
  const { data: orderStatusData, isLoading: isLoadingOrderStatus } =
    useGetOrderStatusDistribution(dateRange);
  const { data: topProductsData, isLoading: isLoadingTopProducts } =
    useGetTopProducts({ ...dateRange, limit: 10 });

  return (
    <div className="space-y-6">
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <CRow>
        <CCol sm={6} lg={3}>
          <StatsCard
            title={t("stats.revenue")}
            value={statsData?.totalRevenue}
            isLoading={isLoadingStats}
            color="success"
            icon={cilMoney}
            isCurrency={true}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <StatsCard
            title={t("stats.newOrders")}
            value={statsData?.totalOrders}
            isLoading={isLoadingStats}
            color="info"
            icon={cilBasket}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <StatsCard
            title={t("stats.newCustomers")}
            value={statsData?.newUsers}
            isLoading={isLoadingStats}
            color="warning"
            icon={cilPeople}
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <StatsCard
            title={t("stats.totalProducts")}
            value={statsData?.totalProducts}
            isLoading={isLoadingStats}
            color="primary"
            icon={cilChartPie}
          />
        </CCol>
      </CRow>

      {/* Hàng chứa 2 biểu đồ chính */}
      <CRow className="g-4">
        <CCol lg={7}>
          <CCard className="h-100 shadow-sm">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <span>{t("quantityChart.title")}</span>
              <CButtonGroup role="group" size="sm">
                <CButton
                  color={barChartMode === "orders" ? "primary" : "secondary"}
                  variant="outline"
                  onClick={() => setBarChartMode("orders")}
                >
                  {t("quantityChart.byOrders")}
                </CButton>
                <CButton
                  color={barChartMode === "products" ? "primary" : "secondary"}
                  variant="outline"
                  onClick={() => setBarChartMode("products")}
                >
                  {t("quantityChart.byProducts")}
                </CButton>
              </CButtonGroup>
            </CCardHeader>
            <CCardBody>
              <SalesBarChart
                data={revenueData}
                isLoading={isLoadingRevenue}
                mode={barChartMode}
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={5}>
          <OrderStatusPieChart
            data={orderStatusData}
            isLoading={isLoadingOrderStatus}
          />
        </CCol>
      </CRow>

      {/* Hàng chứa biểu đồ cột và bảng top sản phẩm */}
      <CRow className="g-4">
        <CCol lg={7}>
          <RevenueChart
            data={revenueData}
            isLoading={isLoadingRevenue}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        </CCol>
        <CCol lg={5}>
          <TopProductsTable
            data={topProductsData}
            isLoading={isLoadingTopProducts}
          />
        </CCol>
      </CRow>
    </div>
  );
}
