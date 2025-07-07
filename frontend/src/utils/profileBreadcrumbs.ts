import { BreadcrumbItem } from "@/types";

/**
 * Interface cho dữ liệu động có thể được truyền vào để xây dựng breadcrumbs.
 * Ví dụ: khi ở trang chi tiết đơn hàng, chúng ta cần `orderId` để hiển thị.
 */
interface DynamicData {
  orderId?: string;
  // Bạn có thể thêm các trường khác ở đây nếu cần cho các trang con khác trong tương lai.
}

/**
 * Định nghĩa một kiểu (type) cho hàm dịch (translation function) mà chúng ta cần.
 * Điều này giúp đảm bảo type-safety và tương thích với hook `useTranslations`.
 * Nó nhận một key là chuỗi và một object giá trị (tùy chọn).
 */
export type ProfileBreadcrumbsTranslator = (
  key:
    | "home"
    | "account"
    | "myOrders"
    | "orderDetails"
    | "addressBook"
    | "voucherWallet",
  values?: Record<string, unknown>,
) => string;

/**
 * Hàm tạo ra một mảng các item breadcrumb cho các trang trong khu vực "Profile".
 * @param pathname - Đường dẫn URL hiện tại (ví dụ: '/profile/orders/123').
 * @param dynamicData - Object chứa dữ liệu động như ID đơn hàng.
 * @param t - Hàm dịch (translation function) từ `next-intl`, đã được khởi tạo với namespace "ProfileBreadcrumbs".
 * @returns Một mảng các đối tượng BreadcrumbItem.
 */
export const generateProfileBreadcrumbs = (
  pathname: string,
  dynamicData: DynamicData = {},
  // Nhận vào hàm `t` đã được khởi tạo sẵn để sử dụng các key dịch.
  t: ProfileBreadcrumbsTranslator,
): BreadcrumbItem[] => {
  // --- Khởi tạo Breadcrumbs cơ bản ---
  // Mọi trang profile đều bắt đầu với Trang chủ và Tài khoản.
  const basePath = "/profile";
  const baseBreadcrumbs: BreadcrumbItem[] = [
    // Link về trang chủ. `t('home')` được giả định là có trong namespace `ProfileBreadcrumbs`.
    // Nếu không, bạn cần truyền một hàm `t` khác hoặc một key cố định.
    { label: t("home"), href: "/" },
    // Link về trang chính của Profile.
    // `isCurrent` được đặt là true nếu đường dẫn hiện tại CHÍNH XÁC là '/profile'.
    { label: t("account"), href: basePath, isCurrent: pathname === basePath },
  ];

  // --- Phân tích các phần của URL ---
  // Lấy các phần của URL sau '/profile/'. Ví dụ: '/profile/orders/123' -> ['orders', '123']
  const segments = pathname.slice(basePath.length).split("/").filter(Boolean);

  // Nếu không có segment nào, tức là đang ở trang `/profile` gốc, trả về breadcrumbs cơ bản.
  if (segments.length === 0 && pathname === basePath) {
    return baseBreadcrumbs;
  }

  // Biến để theo dõi đường dẫn được xây dựng dần.
  let currentPath = basePath;

  // --- Xây dựng Breadcrumbs động dựa trên các segment ---
  // Trường hợp: Đang ở trang đơn hàng
  if (segments[0] === "orders") {
    currentPath += "/orders";
    baseBreadcrumbs.push({
      label: t("myOrders"), // Lấy text "Đơn hàng của tôi"
      href: currentPath,
      isCurrent: segments.length === 1, // Chỉ là trang hiện tại nếu không có segment con (như orderId)
    });

    // Nếu có segment thứ hai (là orderId), thêm breadcrumb cho trang chi tiết.
    if (segments[1] && dynamicData.orderId) {
      currentPath += `/${segments[1]}`;
      baseBreadcrumbs.push({
        // Dùng `t` với placeholder để tạo label động, ví dụ: "Chi tiết đơn #ABCDEF"
        label: t("orderDetails", {
          orderId: dynamicData.orderId.slice(-6).toUpperCase(),
        }),
        href: currentPath,
        isCurrent: true, // Đây luôn là item cuối cùng.
      });
    }
  }
  // Trường hợp: Đang ở trang sổ địa chỉ
  else if (segments[0] === "addresses") {
    currentPath += "/addresses";
    baseBreadcrumbs.push({
      label: t("addressBook"), // Lấy text "Sổ địa chỉ"
      href: currentPath,
      isCurrent: true,
    });
  }
  // Trường hợp: Đang ở trang voucher
  else if (segments[0] === "vouchers") {
    currentPath += "/vouchers";
    baseBreadcrumbs.push({
      label: t("voucherWallet"), // Lấy text "Ví Voucher"
      href: currentPath,
      isCurrent: true,
    });
  }

  // --- Hoàn thiện ---
  // Để đảm bảo chỉ item cuối cùng trong mảng có `isCurrent: true`, ta có thể lặp lại lần cuối.
  // Tuy nhiên, logic trên đã xử lý khá tốt. Bước này là để chắc chắn 100%.
  const finalBreadcrumbs = baseBreadcrumbs.map((item, index, arr) => ({
    ...item,
    isCurrent: index === arr.length - 1,
  }));

  return finalBreadcrumbs;
};
