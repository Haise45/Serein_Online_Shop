import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  DoughnutController,
  LineController,
  BarController,
} from "chart.js";
import { formatCurrency } from "@/lib/utils";

// Đăng ký tất cả các thành phần cần thiết cho các loại biểu đồ của bạn
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Cần cho biểu đồ đường có màu nền (fill: true)
  DoughnutController,
  LineController,
  BarController,
);

// Cấu hình mặc định cho tất cả các biểu đồ (tùy chọn nhưng khuyến khích)
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

// Tùy chỉnh Tooltip mặc định để định dạng tiền tệ
ChartJS.defaults.plugins.tooltip.callbacks.label = function (context) {
  let label = context.dataset.label || "";
  if (label) {
    label += ": ";
  }
  // Kiểm tra xem giá trị đến từ đâu
  // Biểu đồ đường/cột có context.parsed.y
  // Biểu đồ tròn/doughnut có context.parsed (là giá trị số)
  let value: number | null = null;
  if (context.parsed.y !== null && context.parsed.y !== undefined) {
    value = context.parsed.y;
  } else if (typeof context.parsed === "number") {
    value = context.parsed;
  }

  if (value !== null) {
    // Nếu giá trị lớn (tiền tệ), định dạng nó
    if (Math.abs(value) >= 1000) {
      label += formatCurrency(value, true);
    } else {
      // Nếu không, chỉ hiển thị số (ví dụ: số lượng đơn hàng)
      label += value.toLocaleString("vi-VN");
    }
  }

  return label;
};

// Cấu hình mặc định cho trục y
ChartJS.defaults.scales.linear.ticks.callback = function (value) {
  if (typeof value === "number" && value >= 1000) {
    return (value / 1000000).toFixed(1) + "tr"; // Hiển thị dưới dạng triệu
  }
  return value;
};
