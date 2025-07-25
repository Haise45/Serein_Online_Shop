import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FiHome } from "react-icons/fi";

// Lấy logo từ biến môi trường, có fallback an toàn
const LOGO_URL =
  process.env.NEXT_PUBLIC_404_LOGO ||
  "https://res.cloudinary.com/dh7mq8bgc/image/upload/v1752635520/404-error_wzl6d5.png";

/**
 * Metadata tĩnh cho trang 404 gốc.
 * Giúp SEO và hiển thị tiêu đề tab chính xác.
 */
export const metadata: Metadata = {
  title: "404 - Page Not Found | Serein Shop",
};

/**
 * Trang 404 gốc (root not-found).
 * Xử lý các lỗi không tìm thấy ở cấp cao nhất.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xl text-center">
        {/* Hình ảnh minh họa */}
        <div className="relative mx-auto mb-8 h-64 w-64 animate-float sm:h-80 sm:w-80">
          <Image
            src={LOGO_URL}
            alt="Page not found illustration"
            layout="fill"
            objectFit="contain"
            priority
          />
        </div>

        {/* Tiêu đề chính */}
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-800 sm:text-5xl">
          Oops! Page Not Found
        </h1>

        {/* Mô tả */}
        <p className="mt-4 text-base text-gray-600 sm:text-lg">
          The page or resource you are looking for could not be found.
        </p>

        {/* Nút hành động */}
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <FiHome className="mr-2 h-5 w-5" />
            Return to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}