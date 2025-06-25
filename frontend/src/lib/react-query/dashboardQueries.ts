import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStatsApi,
  getRevenueChartDataApi,
  getOrderStatusDistributionApi,
  getTopProductsApi,
  DateRangeParams,
  RevenueChartParams,
  TopProductsParams,
} from "@/services/dashboardService";
import {
  DashboardStats,
  ChartJsData,
  OrderStatusDistributionItem,
  TopSellingProduct,
} from "@/types/dashboard";

// --- Query Keys ---
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (filters: DateRangeParams) =>
    [...dashboardKeys.all, "stats", filters] as const,
  revenueChart: (filters: RevenueChartParams) =>
    [...dashboardKeys.all, "revenueChart", filters] as const,
  orderStatusDistribution: (filters: DateRangeParams) =>
    [...dashboardKeys.all, "orderStatusDistribution", filters] as const,
  topProducts: (filters: TopProductsParams) =>
    [...dashboardKeys.all, "topProducts", filters] as const,
};

// --- Custom Hooks ---

/**
 * Hook để lấy các số liệu thống kê tổng quan (doanh thu, đơn hàng, ...).
 */
export const useGetDashboardStats = (filters: DateRangeParams) => {
  return useQuery<DashboardStats, Error>({
    queryKey: dashboardKeys.stats(filters),
    queryFn: () => getDashboardStatsApi(filters),
    staleTime: 1000 * 60 * 5, // 5 phút
  });
};

/**
 * Hook để lấy dữ liệu cho biểu đồ doanh thu.
 */
export const useGetRevenueChartData = (filters: RevenueChartParams) => {
  return useQuery<ChartJsData, Error>({
    queryKey: dashboardKeys.revenueChart(filters),
    queryFn: () => getRevenueChartDataApi(filters),
    staleTime: 1000 * 60 * 5,
    // Chỉ fetch khi có đủ startDate và endDate
    enabled: !!filters.startDate && !!filters.endDate,
  });
};

/**
 * Hook để lấy dữ liệu cho biểu đồ tròn phân phối trạng thái đơn hàng.
 */
export const useGetOrderStatusDistribution = (filters: DateRangeParams) => {
  return useQuery<OrderStatusDistributionItem[], Error>({
    queryKey: dashboardKeys.orderStatusDistribution(filters),
    queryFn: () => getOrderStatusDistributionApi(filters),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook để lấy danh sách top sản phẩm bán chạy.
 */
export const useGetTopProducts = (filters: TopProductsParams) => {
  return useQuery<TopSellingProduct[], Error>({
    queryKey: dashboardKeys.topProducts(filters),
    queryFn: () => getTopProductsApi(filters),
    staleTime: 1000 * 60 * 5,
  });
};
