import axiosInstance from "@/lib/axiosInstance";
import {
  DashboardStats,
  ChartJsData,
  OrderStatusDistributionItem,
  TopSellingProduct,
} from "@/types/dashboard";

// Tham số chung cho các API có lọc theo ngày
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// API lấy các thẻ thống kê tổng quan
export const getDashboardStatsApi = async (
  params: DateRangeParams,
): Promise<DashboardStats> => {
  const { data } = await axiosInstance.get<DashboardStats>("/dashboard/stats", {
    params,
  });
  return data;
};

// API lấy dữ liệu cho biểu đồ doanh thu
export interface RevenueChartParams extends DateRangeParams {
  groupBy: "day" | "month" | "year";
}
export const getRevenueChartDataApi = async (
  params: RevenueChartParams,
): Promise<ChartJsData> => {
  const { data } = await axiosInstance.get<ChartJsData>(
    "/dashboard/revenue-chart",
    { params },
  );
  return data;
};

// API lấy dữ liệu cho biểu đồ tròn phân phối trạng thái đơn hàng
export const getOrderStatusDistributionApi = async (
  params: DateRangeParams,
): Promise<OrderStatusDistributionItem[]> => {
  const { data } = await axiosInstance.get<OrderStatusDistributionItem[]>(
    "/dashboard/order-status-distribution",
    { params },
  );
  return data;
};

// API lấy top sản phẩm bán chạy
export interface TopProductsParams extends DateRangeParams {
  limit?: number;
}
export const getTopProductsApi = async (
  params: TopProductsParams,
): Promise<TopSellingProduct[]> => {
  const { data } = await axiosInstance.get<TopSellingProduct[]>(
    "/dashboard/top-products",
    { params },
  );
  return data;
};
