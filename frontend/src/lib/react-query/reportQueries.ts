import {
  CustomerReportParams,
  DateRangeParams,
  getCustomerReportApi,
  getInventoryReportApi,
  getProductReportApi,
  getSalesReportApi,
  InventoryReportParams,
  ProductReportParams,
} from "@/services/reportService";
import {
  CustomerReportData,
  InventoryReportData,
  ProductReportData,
  SalesReportData,
} from "@/types/report";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

// --- Query Keys ---
export const reportKeys = {
  all: ["reports"] as const,
  sales: (filters: DateRangeParams) =>
    [...reportKeys.all, "sales", filters] as const,
  products: (filters: ProductReportParams) =>
    [...reportKeys.all, "products", filters] as const,
  customers: (filters: CustomerReportParams) =>
    [...reportKeys.all, "customers", filters] as const,
  inventory: (filters: InventoryReportParams) =>
    [...reportKeys.all, "inventory", filters] as const,
};

// --- Custom Hooks ---

/**
 * Hook để lấy báo cáo bán hàng tổng quan.
 */
export const useGetSalesReport = (
  filters: DateRangeParams,
  options?: Omit<
    UseQueryOptions<SalesReportData, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<SalesReportData, Error>({
    queryKey: reportKeys.sales(filters),
    queryFn: () => getSalesReportApi(filters),
    staleTime: 1000 * 60 * 15, // 15 phút
    enabled: !!filters.startDate && !!filters.endDate, // Chỉ chạy khi có khoảng ngày
    ...options,
  });
};

/**
 * Hook để lấy báo cáo về sản phẩm (bán chạy, doanh thu cao).
 */
export const useGetProductReport = (
  filters: ProductReportParams,
  options?: Omit<
    UseQueryOptions<ProductReportData, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<ProductReportData, Error>({
    queryKey: reportKeys.products(filters),
    queryFn: () => getProductReportApi(filters),
    staleTime: 1000 * 60 * 15,
    enabled: !!filters.startDate && !!filters.endDate,
    ...options,
  });
};

/**
 * Hook để lấy báo cáo về khách hàng (mới, chi tiêu nhiều).
 */
export const useGetCustomerReport = (
  filters: CustomerReportParams,
  options?: Omit<
    UseQueryOptions<CustomerReportData, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<CustomerReportData, Error>({
    queryKey: reportKeys.customers(filters),
    queryFn: () => getCustomerReportApi(filters),
    staleTime: 1000 * 60 * 15,
    enabled: !!filters.startDate && !!filters.endDate,
    ...options,
  });
};

/**
 * Hook để lấy báo cáo tồn kho. Báo cáo này không phụ thuộc ngày tháng.
 */
export const useGetInventoryReport = (
  filters: InventoryReportParams,
  options?: Omit<
    UseQueryOptions<InventoryReportData, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<InventoryReportData, Error>({
    queryKey: reportKeys.inventory(filters),
    queryFn: () => getInventoryReportApi(filters),
    staleTime: 1000 * 60 * 15,
    ...options,
  });
};
