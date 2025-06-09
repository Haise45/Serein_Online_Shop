import { Category } from "@/types";
import DOMPurify from "isomorphic-dompurify";

export const buildCategoryTree = (
  categories: Category[],
  parentId: string | null = null,
): (Category & { children?: Category[] })[] => {
  const tree: (Category & { children?: Category[] })[] = [];
  const children = categories.filter((category) => {
    const categoryParentId = category.parent
      ? typeof category.parent === "string"
        ? category.parent
        : category.parent._id
      : null;
    const targetParentId = parentId ? parentId.toString() : null;
    return categoryParentId === targetParentId;
  });

  for (const child of children) {
    const grandchildren = buildCategoryTree(categories, child._id);
    if (grandchildren.length > 0) {
      child.children = grandchildren;
    }
    tree.push(child);
  }
  return tree;
};

export const flattenTreeForSelect = (
  categoryTree: (Category & { children?: Category[] })[],
  level = 0,
  prefix = "-- ",
): Category[] => {
  let flattened: Category[] = [];
  for (const category of categoryTree) {
    flattened.push({
      ...category,
      displayName: `${prefix.repeat(level)}${category.name}`,
    });
    if (category.children && category.children.length > 0) {
      flattened = flattened.concat(
        flattenTreeForSelect(category.children, level + 1, prefix),
      );
    }
  }
  return flattened;
};

/**
 * Định dạng số thành chuỗi tiền tệ VND.
 * @param amount Số tiền cần định dạng.
 * @param defaultValue Giá trị trả về nếu amount không hợp lệ (mặc định là chuỗi rỗng).
 * @returns Chuỗi tiền tệ đã định dạng hoặc giá trị mặc định.
 */
export const formatCurrency = (
  amount?: number | null,
  includeCurrencySymbol: boolean = true, // Thêm tham số này
  defaultValue: string = "",
): string => {
  // Kiểm tra xem amount có phải là số hợp lệ không
  if (typeof amount !== "number" || isNaN(amount)) {
    return defaultValue; // Trả về giá trị mặc định nếu không phải số
  }
  try {
    return amount.toLocaleString("vi-VN", {
      style: includeCurrencySymbol ? "currency" : "decimal", // Thay đổi style
      currency: "VND",
    });
  } catch (error) {
    console.error("Lỗi khi định dạng tiền tệ:", error, "Với giá trị:", amount);
    return defaultValue; // Trả về giá trị mặc định nếu có lỗi xảy ra
  }
};

export const parseCurrency = (formattedValue: string): number | undefined => {
  if (!formattedValue) return undefined;
  const numericValue = Number(formattedValue.replace(/\D/g, ""));
  return isNaN(numericValue) ? undefined : numericValue;
};

export const formatDate = (dateInput?: string | Date | null): string => {
  if (!dateInput) return "N/A";
  try {
    return new Date(dateInput).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

/**
 * Làm sạch một chuỗi HTML để ngăn chặn các cuộc tấn công XSS.
 * Sử dụng DOMPurify, hoạt động được cả ở server-side và client-side.
 * @param dirtyHtml Chuỗi HTML có khả năng chứa mã độc.
 * @returns Chuỗi HTML đã được làm sạch.
 */
export const sanitizeHtmlContent = (
  dirtyHtml: string | null | undefined,
): string => {
  if (
    dirtyHtml === null ||
    dirtyHtml === undefined ||
    typeof dirtyHtml !== "string"
  ) {
    return ""; // Trả về chuỗi rỗng nếu đầu vào không hợp lệ
  }

  // Sử dụng cấu hình mặc định thường là đủ tốt
  const clean = DOMPurify.sanitize(dirtyHtml);
  return clean;
};
