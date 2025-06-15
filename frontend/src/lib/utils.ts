import { Category, VariantOptionValue } from "@/types";
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
  defaultValue: string = "Liên hệ",
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
 * Làm sạch một chuỗi HTML để ngăn chặn các cuộc tấn công XSS,
 * nhưng vẫn cho phép các thẻ định dạng an toàn từ trình soạn thảo văn bản (rich text editor).
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

  if (typeof window === "undefined") {
    return "";
  }

  const clean = DOMPurify.sanitize(dirtyHtml, {
    // Cho phép các thẻ HTML sau đây. Đây là những thẻ phổ biến từ CKEditor.
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "p",
      "a",
      "ul",
      "ol",
      "nl",
      "li",
      "b",
      "i",
      "strong",
      "em",
      "strike",
      "code",
      "hr",
      "br",
      "div",
      "table",
      "thead",
      "caption",
      "tbody",
      "tr",
      "th",
      "td",
      "pre",
      "img",
      "figure",
      "figcaption",
      "s",
      "u",
    ],
    // Cho phép các thuộc tính sau đây trên các thẻ.
    ALLOWED_ATTR: [
      "href",
      "name",
      "target",
      "src",
      "alt",
      "title",
      "width",
      "height",
      "style",
      "class",
      "id",
      "align",
      "allowfullscreen",
      "frameborder",
      "scrolling",
    ],
    // Cấu hình an toàn cho iframe (nếu bạn dùng video embed từ Youtube, v.v.)
    ADD_TAGS: ["iframe"],
  });

  return clean;
};
export function timeAgo(dateInput: string | Date): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44); // Trung bình số ngày trong tháng
  const years = Math.round(days / 365.25); // Trung bình số ngày trong năm (tính năm nhuận)

  if (seconds < 5) return "vài giây trước";
  if (seconds < 60) return `${seconds} giây trước`;
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  if (weeks < 5) return `${weeks} tuần trước`; // Sau khoảng 4 tuần thì hiển thị tháng
  if (months < 12) return `${months} tháng trước`;
  return `${years} năm trước`;
}

/**
 * Chuyển đổi một mảng optionValues (chứa ID) thành một chuỗi tên hiển thị.
 * @param optionValues Mảng các lựa chọn của biến thể.
 * @param attributeMap Một Map đã được tạo sẵn để tra cứu tên từ ID.
 * @returns Một chuỗi tên hiển thị, ví dụ: "Xanh Nhật / S".
 */
export const getVariantDisplayName = (
  optionValues: VariantOptionValue[],
  attributeMap: Map<string, { label: string; values: Map<string, string> }>,
): string => {
  if (!optionValues || !attributeMap) return "N/A";

  return optionValues
    .map((opt) => {
      const attrId =
        typeof opt.attribute === "string" ? opt.attribute : opt.attribute._id;
      const valueId = typeof opt.value === "string" ? opt.value : opt.value._id;

      const attrInfo = attributeMap.get(attrId);
      const label = attrInfo?.label || "Thuộc tính";
      const valueName = attrInfo?.values.get(valueId) || "?";

      return `${label}: ${valueName}`;
    })
    .join(" / ");
};
