import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Một danh sách các ngôn ngữ được hỗ trợ
  locales: ["vi", "en"],

  // Ngôn ngữ mặc định
  defaultLocale: "vi",

  // Không hiển thị tiền tố cho ngôn ngữ mặc định (ví dụ: /products thay vì /vi/products)
  localePrefix: "as-needed",
});
