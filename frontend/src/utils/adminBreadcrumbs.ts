import { BreadcrumbItem } from "@/types";

// Dữ liệu động không thay đổi
export interface AdminDynamicData {
  productName?: string;
  orderId?: string;
  userName?: string;
}

// Nó sẽ tự động lấy các key từ file JSON của bạn.
export type AdminBreadcrumbsTranslator = (
  key: keyof (typeof import("../../messages/vi.json"))["Admin"]["breadcrumbs"],
  values?: Record<string, unknown>,
) => string;

export const generateAdminBreadcrumbs = (
  pathname: string,
  dynamicData: AdminDynamicData = {},
  t: AdminBreadcrumbsTranslator,
): BreadcrumbItem[] => {
  const basePath = "/admin";

  // SỬA LỖI CỐT LÕI: Bỏ qua tiền tố locale và base path khi xử lý
  const segments = pathname
    .replace(basePath, "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0 || segments[0] === "dashboard") {
    return [
      { label: t("dashboard"), href: `${basePath}/dashboard`, isCurrent: true },
    ];
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t("dashboard"), href: `${basePath}/dashboard`, isCurrent: false },
  ];

  let currentPath = basePath;

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    let label = "";

    // Xử lý các ID động (logic không đổi)
    const prevSegment = segments[index - 1];
    // Bước 1: Ưu tiên kiểm tra xem segment có phải là một ID động hay không.
    if (prevSegment === "products" && segment !== "create") {
      label =
        dynamicData.productName ||
        t("productWithId", { id: segment.slice(-6) });
    } else if (prevSegment === "orders" && segment !== "create") {
      label =
        dynamicData.orderId || t("orderWithId", { id: segment.slice(-6) });
    } else if (prevSegment === "users" && segment !== "create") {
      label =
        dynamicData.userName || t("userWithId", { id: segment.slice(-6) });
    } else {
      // Bước 2: Nếu không phải ID, thì mới tiến hành dịch nó như một key tĩnh.
      // Dòng này giờ đây sẽ không bao giờ nhận một ID để dịch.
      label =
        t(segment as Parameters<AdminBreadcrumbsTranslator>[0]) ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    breadcrumbs.push({
      label: label,
      href: currentPath,
      isCurrent: isLast,
    });
  });

  // Post-processing
  if (
    breadcrumbs.length >= 3 &&
    breadcrumbs[breadcrumbs.length - 1].label === t("edit")
  ) {
    const objectLabel = breadcrumbs[breadcrumbs.length - 2].label;
    breadcrumbs.pop();
    breadcrumbs.pop();
    breadcrumbs.push({
      label: t("editObject", { objectLabel: objectLabel }),
      href: currentPath,
      isCurrent: true,
    });
  } else if (
    breadcrumbs.length >= 2 &&
    breadcrumbs[breadcrumbs.length - 1].label === t("create")
  ) {
    const objectTypeLabel = breadcrumbs[breadcrumbs.length - 2].label;
    breadcrumbs.pop();
    breadcrumbs[breadcrumbs.length - 1].label = t("createObject", {
      objectTypeLabel: objectTypeLabel,
    });
    breadcrumbs[breadcrumbs.length - 1].isCurrent = true;
  }

  return breadcrumbs;
};
