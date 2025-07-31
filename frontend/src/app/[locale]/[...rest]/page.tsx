import { notFound } from "next/navigation";

/**
 * Đây là một trang "catch-all" (bắt tất cả).
 * Bất kỳ URL nào không khớp với các trang hiện có bên trong [locale]
 * (ví dụ: /vi/sale-off, /en/about-us/team) sẽ được điều hướng đến đây.
 *
 * Nhiệm vụ duy nhất của nó là gọi hàm `notFound()`,
 * điều này sẽ kích hoạt và hiển thị file `not-found.tsx` gần nhất
 * trong cây thư mục, tức là `src/app/[locale]/not-found.tsx`.
 */
export default function CatchAllPage() {
  notFound();
}
