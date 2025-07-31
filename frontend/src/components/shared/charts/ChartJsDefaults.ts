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
