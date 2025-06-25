// Dữ liệu cho các thẻ thống kê tổng quan
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  newUsers: number;
  totalProducts: number;
}

// Dữ liệu chung cho các biểu đồ của Chart.js
export interface ChartJsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Dữ liệu trả về từ API cho biểu đồ phân phối trạng thái đơn hàng
export interface OrderStatusDistributionItem {
  _id: string; // Tên trạng thái, ví dụ: "Delivered"
  count: number;
}

// Dữ liệu cho một sản phẩm trong bảng top-selling
export interface TopSellingProduct {
  productId: string;
  name: string;
  image: string | null;
  averageRating: number;
  totalSold: number;
}
