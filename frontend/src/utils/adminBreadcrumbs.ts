import { BreadcrumbItem } from "@/types";

// Map để dịch các segment sang label tiếng Việt
const segmentToLabelMap: Record<string, string> = {
  products: "Sản phẩm",
  categories: "Danh mục",
  orders: "Đơn hàng",
  attributes: "Thuộc tính",
  users: "Người dùng",
  coupons: "Mã giảm giá",
  reviews: "Đánh giá",
  settings: "Cài đặt",
  create: "Thêm mới",
  edit: "Chỉnh sửa",
  notifications: "Thông báo",
  reports: "Thống kê",
  print: " In đơn hàng",
};

// Dữ liệu động có thể được truyền vào
export interface AdminDynamicData {
  productName?: string;
  orderId?: string;
  userName?: string;
  // Thêm các dữ liệu khác nếu cần
}

export const generateAdminBreadcrumbs = (
  pathname: string,
  dynamicData: AdminDynamicData = {},
): BreadcrumbItem[] => {
  const basePath = "/admin";

  // Xử lý trường hợp chỉ có /admin
  if (pathname === basePath) {
    return [
      { label: "Dashboard", href: `${basePath}/dashboard`, isCurrent: true },
    ];
  }

  const segments = pathname.replace(basePath, "").split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] === "dashboard") {
    return [
      { label: "Dashboard", href: `${basePath}/dashboard`, isCurrent: true },
    ];
  }

  // Luôn bắt đầu với Dashboard
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", href: `${basePath}/dashboard`, isCurrent: false },
  ];

  let currentPath = basePath;

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Ưu tiên tra cứu trong map, nếu không có thì dùng segment đã format
    let label =
      segmentToLabelMap[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);

    // Xử lý các ID động
    const prevSegment = segments[index - 1];
    if (prevSegment === "products" && segment !== "create") {
      label = dynamicData.productName || `Sản phẩm #${segment.slice(-6)}`;
    } else if (prevSegment === "orders" && segment !== "create") {
      label = dynamicData.orderId || `Đơn hàng #${segment.slice(-6)}`;
    } else if (prevSegment === "users" && segment !== "create") {
      label = dynamicData.userName || `Người dùng #${segment.slice(-6)}`;
    }

    breadcrumbs.push({
      label: label,
      href: currentPath,
      isCurrent: isLast,
    });
  });

  // Post-processing để logic label "Thêm mới" và "Chỉnh sửa" đơn giản hơn
  // Ví dụ: [..., "Sản phẩm", "ID_SP", "Chỉnh sửa"] -> [..., "Sản phẩm", "Chỉnh sửa Sản phẩm"]
  if (
    breadcrumbs.length >= 3 &&
    breadcrumbs[breadcrumbs.length - 1].label === "Chỉnh sửa"
  ) {
    const objectLabel = breadcrumbs[breadcrumbs.length - 2].label;
    breadcrumbs.pop(); // Xóa item "Chỉnh sửa"
    breadcrumbs.pop(); // Xóa item "ID_SP"
    breadcrumbs.push({
      label: `Chỉnh sửa: ${objectLabel}`,
      href: currentPath,
      isCurrent: true,
    });
  } else if (
    breadcrumbs.length >= 2 &&
    breadcrumbs[breadcrumbs.length - 1].label === "Thêm mới"
  ) {
    const objectTypeLabel = breadcrumbs[breadcrumbs.length - 2].label;
    breadcrumbs.pop(); // Xóa item "Thêm mới"
    breadcrumbs[breadcrumbs.length - 1].label = `Thêm mới ${objectTypeLabel}`;
    breadcrumbs[breadcrumbs.length - 1].isCurrent = true;
  }

  return breadcrumbs;
};
