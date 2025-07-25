// FILE: src/app/[locale]/not-found.tsx

import FooterClient from "@/components/client/layout/FooterClient";
import NavbarClient from "@/components/client/layout/NavbarClient";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { FiHome } from "react-icons/fi";

// Lấy logo từ biến môi trường
const LOGO_URL =
  process.env.NEXT_PUBLIC_404_LOGO ||
  "https://res.cloudinary.com/dh7mq8bgc/image/upload/v1752635520/404-error_wzl6d5.png";

/**
 * Metadata động cho trang 404, dịch theo ngôn ngữ.
 */
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale,
    namespace: "NotFoundPage.meta",
  });
  return {
    title: t("title"),
  };
}

/**
 * Trang 404 đa ngôn ngữ, hiển thị bên trong layout chính.
 * Xử lý lỗi khi URL có locale hợp lệ nhưng trang con không tồn tại.
 */
export default async function LocaleNotFoundPage() {
  const t = await getTranslations("NotFoundPage");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <NavbarClient />
      <main className="flex flex-grow items-center justify-center p-6">
        <div className="w-full text-center">
          {/* Hình ảnh minh họa */}
          <div className="animate-float relative mx-auto mb-8 h-64 w-64 sm:h-80 sm:w-80">
            <Image
              src={LOGO_URL}
              alt={t("imageAlt")}
              layout="fill"
              objectFit="contain"
              priority
            />
          </div>

          {/* Tiêu đề chính */}
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-800 sm:text-5xl">
            {t("title")}
          </h1>

          {/* Mô tả */}
          <p className="mt-4 text-base text-gray-600 sm:text-lg">
            {t("subtitle")}
          </p>

          {/* Các nút hành động */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              <FiHome className="mr-2 h-5 w-5" />
              {t("backToHome")}
            </Link>
            {/* <Link
              href="/contact" // Giả sử bạn có trang liên hệ
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-sm transition-all duration-200 ease-in-out hover:bg-gray-100 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <FiHelpCircle className="mr-2 h-5 w-5" />
              {t("contactSupport")}
            </Link> */}
          </div>
        </div>
      </main>
      <FooterClient />
    </div>
  );
}
