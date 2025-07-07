"use client";
import { BreadcrumbItem } from "@/types"; // Import type đã tạo
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHomeIcon?: boolean; // Tùy chọn hiển thị icon trang chủ
}

export default function Breadcrumbs({
  items,
  showHomeIcon = true,
}: BreadcrumbsProps) {
  const t = useTranslations("Breadcrumbs");

  if (!items || items.length === 0) {
    return null;
  }

  // Thêm item "Trang chủ" vào đầu nếu được yêu cầu và chưa có
  const breadcrumbItems = [...items];
  if (showHomeIcon && (items.length === 0 || items[0].href !== "/")) {
    breadcrumbItems.unshift({ label: t("home"), href: "/" });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 text-gray-600 text-sm"
    >
      <ol
        role="list"
        className="flex flex-wrap items-center gap-x-1 gap-y-1 sm:gap-x-2"
      >
        {breadcrumbItems.map((item, index) => {
          const isHiddenOnMobile =
            breadcrumbItems.length > 2 &&
            index > 0 &&
            index < breadcrumbItems.length - 1;

          return (
            <li
              key={item.href || item.label}
              className={`${isHiddenOnMobile ? "hidden sm:inline-flex" : ""}`}
            >
              <div className="flex items-center">
                {index > 0 && (
                  <FiChevronRight
                    className="h-4 w-4 text-gray-400"
                    aria-hidden="true"
                  />
                )}
                {item.href && !item.isCurrent ? (
                  <Link
                    href={item.href}
                    className={`ml-1.5 rounded font-medium text-gray-500 transition hover:text-indigo-600 sm:ml-2 ${index === 0 && showHomeIcon ? "flex items-center" : ""}`}
                  >
                    {index === 0 && showHomeIcon && (
                      <FiHome className="mr-1.5 h-4 w-4" />
                    )}
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`ml-1.5 font-medium sm:ml-2 ${item.isCurrent ? "font-semibold text-gray-800" : "text-gray-500"} ${index === 0 && showHomeIcon ? "flex items-center" : ""}`}
                  >
                    {index === 0 && showHomeIcon && (
                      <FiHome className="mr-1.5 h-4 w-4" />
                    )}
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
