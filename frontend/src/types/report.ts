import { Product, VariantOptionValue } from ".";

// --- BÁO CÁO BÁN HÀNG (SALES REPORT) ---

// Dữ liệu tóm tắt
export interface SalesReportSummary {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  totalDiscount: number;
  averageOrderValue: number;
}

// Dữ liệu theo phương thức thanh toán
export interface SalesByPaymentMethod {
  _id: string; // Tên phương thức, ví dụ: "COD", "PAYPAL"
  count: number;
  totalValue: number;
}

// Response đầy đủ của API báo cáo bán hàng
export interface SalesReportData {
  summary: SalesReportSummary;
  byPaymentMethod: SalesByPaymentMethod[];
}

// --- BÁO CÁO SẢN PHẨM (PRODUCT REPORT) ---

// Dữ liệu cho một sản phẩm trong báo cáo
export interface ProductReportItem {
  _id: string;
  name: string;
  image: string | null;
  totalSold?: number; // Cho top bán chạy theo số lượng
  revenue?: number; // Cho top bán chạy theo doanh thu
}

// Response đầy đủ của API báo cáo sản phẩm
export interface ProductReportData {
  topByQuantity: ProductReportItem[];
  topByRevenue: ProductReportItem[];
}

// --- BÁO CÁO KHÁCH HÀNG (CUSTOMER REPORT) ---

// Dữ liệu cho một khách hàng trong báo cáo
export interface CustomerReportItem {
  _id: string; // User ID
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
}

// Response đầy đủ của API báo cáo khách hàng
export interface CustomerReportData {
  newCustomersCount: number;
  topSpenders: CustomerReportItem[];
}

// --- BÁO CÁO TỒN KHO (INVENTORY REPORT) ---

// Dữ liệu cho một sản phẩm sắp hết hàng
export interface LowStockProductItem
  extends Pick<Product, "name" | "sku" | "stockQuantity" | "images"> {
  _id: string;
  productId: string;
  variantOptions?: VariantOptionValue[];
}

// Response đầy đủ của API báo cáo tồn kho
export interface InventoryReportData {
  totalInventoryValue: number;
  lowStockProducts: LowStockProductItem[];
  outOfStockProducts: LowStockProductItem[];
  outOfStockCount: number;
}
