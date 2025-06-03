import { BreadcrumbItem } from "@/types";

interface DynamicData {
  orderId?: string;
  // Thêm các dữ liệu khác nếu cần cho các trang profile khác
}

export const generateProfileBreadcrumbs = (
  pathname: string,
  dynamicData: DynamicData = {},
): BreadcrumbItem[] => {
  const basePath = "/profile";
  const baseLabel = "Tài khoản";
  const baseBreadcrumbs: BreadcrumbItem[] = [
    { label: "Trang Chủ", href: "/" },
    { label: baseLabel, href: basePath, isCurrent: pathname === basePath },
  ];

  const segments = pathname.slice(basePath.length).split("/").filter(Boolean); // Lấy các segment sau /profile

  if (segments.length === 0 && pathname === basePath) {
    // Trang /profile (ví dụ: thông tin tài khoản)
    // baseBreadcrumbs[1].isCurrent đã được set
    return baseBreadcrumbs;
  }

  let currentPath = basePath;

  if (segments[0] === "orders") {
    currentPath += "/orders";
    baseBreadcrumbs.push({
      label: "Đơn hàng của tôi",
      href: currentPath,
      isCurrent:
        segments.length === 1 || (segments.length === 2 && !segments[1]), // /profile/orders
    });
    if (segments[1] && dynamicData.orderId) {
      // Trang chi tiết đơn hàng /profile/orders/[orderId]
      currentPath += `/${segments[1]}`; // segments[1] chính là orderId
      baseBreadcrumbs.push({
        label: `Chi tiết đơn #${dynamicData.orderId.slice(-6).toUpperCase()}`,
        href: currentPath,
        isCurrent: true,
      });
    }
  } else if (segments[0] === "addresses") {
    currentPath += "/addresses";
    baseBreadcrumbs.push({
      label: "Sổ địa chỉ",
      href: currentPath,
      isCurrent: true,
    });
  } else if (
    segments[0] === "settings" ||
    (segments.length === 0 && pathname === basePath)
  ) {
  } else if (segments[0] === "vouchers") {
    currentPath += "/vouchers";
    baseBreadcrumbs.push({
      label: "Ví Voucher",
      href: currentPath,
      isCurrent: true,
    });
  }

  // Đảm bảo chỉ item cuối cùng có isCurrent = true (nếu logic ở trên chưa chuẩn)
  // Hoặc logic isCurrent trong từng push đã đúng
  const finalBreadcrumbs = baseBreadcrumbs.map((item, index, arr) => ({
    ...item,
    isCurrent: index === arr.length - 1,
  }));
  // Nếu trang profile chính là /profile, thì breadcrumb "Tài khoản" phải là isCurrent khi ở /profile
  if (pathname === basePath && finalBreadcrumbs.length > 1) {
    finalBreadcrumbs[finalBreadcrumbs.length - 1].isCurrent = false;
    finalBreadcrumbs.find((b) => b.href === basePath)!.isCurrent = true;
  }

  return finalBreadcrumbs;
};
