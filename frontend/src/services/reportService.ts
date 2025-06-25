import axiosInstance from "@/lib/axiosInstance";
import {
  SalesReportData,
  ProductReportData,
  CustomerReportData,
  InventoryReportData,
} from "@/types/report";

// Tham số chung cho các API có lọc theo ngày
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// Tham số cho báo cáo sản phẩm
export interface ProductReportParams extends DateRangeParams {
  limit?: number;
}

// Tham số cho báo cáo khách hàng
export interface CustomerReportParams extends DateRangeParams {
  limit?: number;
}

// Tham số cho báo cáo tồn kho
export interface InventoryReportParams {
  lowStockThreshold?: number;
}

// API lấy báo cáo bán hàng
export const getSalesReportApi = async (
  params: DateRangeParams,
): Promise<SalesReportData> => {
  const { data } = await axiosInstance.get<SalesReportData>("/reports/sales", {
    params,
  });
  return data;
};

// API lấy báo cáo sản phẩm
export const getProductReportApi = async (
  params: ProductReportParams,
): Promise<ProductReportData> => {
  const { data } = await axiosInstance.get<ProductReportData>(
    "/reports/products",
    { params },
  );
  return data;
};

// API lấy báo cáo khách hàng
export const getCustomerReportApi = async (
  params: CustomerReportParams,
): Promise<CustomerReportData> => {
  const { data } = await axiosInstance.get<CustomerReportData>(
    "/reports/customers",
    { params },
  );
  return data;
};

// API lấy báo cáo tồn kho
export const getInventoryReportApi = async (
  params: InventoryReportParams,
): Promise<InventoryReportData> => {
  const { data } = await axiosInstance.get<InventoryReportData>(
    "/reports/inventory",
    { params },
  );
  return data;
};
