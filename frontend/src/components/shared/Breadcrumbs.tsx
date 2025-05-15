"use client";
import { BreadcrumbItem } from "@/types"; // Import type đã tạo
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
  if (!items || items.length === 0) {
    return null;
  }

  // Thêm item "Trang chủ" vào đầu nếu được yêu cầu và chưa có
  const breadcrumbItems = [...items];
  if (showHomeIcon && (items.length === 0 || items[0].href !== "/")) {
    breadcrumbItems.unshift({ label: "Trang chủ", href: "/" });
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-600">
      <ol role="list" className="flex items-center space-x-1.5 sm:space-x-2">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href || item.label}>
            <div className="flex items-center">
              {index > 0 && ( // Chỉ hiển thị dấu phân cách từ item thứ hai
                <FiChevronRight
                  className="h-4 w-4 flex-shrink-0 text-gray-400"
                  aria-hidden="true"
                />
              )}
              {item.href && !item.isCurrent ? (
                <Link
                  href={item.href}
                  className={`ml-1.5 font-medium text-gray-500 transition-colors hover:text-indigo-600 sm:ml-2 ${index === 0 && showHomeIcon ? "flex items-center" : ""}`}
                >
                  {index === 0 && showHomeIcon && (
                    <FiHome className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  )}
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`ml-1.5 font-medium sm:ml-2 ${item.isCurrent ? "font-semibold text-gray-800" : "text-gray-500"} ${index === 0 && showHomeIcon ? "flex items-center" : ""}`}
                >
                  {index === 0 && showHomeIcon && (
                    <FiHome className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  )}
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
