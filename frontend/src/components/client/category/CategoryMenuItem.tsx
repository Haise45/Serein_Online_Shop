"use client";

import { Category } from "@/types";
import classNames from "classnames";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CategoryMenuItemProps {
  category: Category & { children?: Category[] };
  level?: number;
  isMobile?: boolean;
  onNavigate?: () => void; // Để đóng SideDrawer trên mobile
  onShowOverlay?: () => void;
  onHideOverlay?: () => void;
}

const CategoryMenuItem: React.FC<CategoryMenuItemProps> = ({
  category,
  level = 0,
  isMobile = false,
  onNavigate,
  onShowOverlay,
  onHideOverlay,
}) => {
  const t = useTranslations("CategoryMenu");
  const [isOpen, setIsOpen] = useState(false); // Cho hover trên desktop và click trên mobile
  const hasChildren = category.children && category.children.length > 0;
  const router = useRouter();
  const locale = useLocale();

  const categoryLinkHref = `/products?category=${category.slug}`;

  // *** HÀM HELPER ĐỂ LẤY TÊN ĐÃ ĐƯỢC DỊCH ***
  const getLocalizedName = (
    name: string | { vi: string; en: string } | null | undefined,
  ): string => {
    // 1. Xử lý các trường hợp không hợp lệ trước
    if (!name) {
      return ""; // Hoặc một chuỗi mặc định nào đó
    }

    // 2. Nếu nó là một object, xử lý logic đa ngôn ngữ
    if (typeof name === "object") {
      // Ưu tiên ngôn ngữ hiện tại, fallback về tiếng Việt, cuối cùng là chuỗi rỗng
      return name[locale as "vi" | "en"] || name.vi || "";
    }

    // 3. Nếu không phải object, nó chắc chắn là một chuỗi string, trả về chính nó
    return name;
  };

  const localizedCategoryName = getLocalizedName(category.name);

  // --- LOGIC CHO MOBILE HOẶC DESKTOP SUB-MENU (dropdown thường) ---
  const handleSimpleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else {
      router.push(categoryLinkHref);
      if (onNavigate) onNavigate();
    }
  };

  const handleNavigateToParent = () => {
    if (onNavigate) onNavigate();
  };

  // Case 1: DESKTOP - TOP LEVEL (level 0) - ITEM CÓ CON -> MEGA MENU
  if (!isMobile && level === 0 && hasChildren) {
    const handleMouseEnter = () => {
      setIsOpen(true);
      if (onShowOverlay) {
        onShowOverlay();
      }
    };

    const handleMouseLeave = () => {
      setIsOpen(false);
      if (onHideOverlay) {
        onHideOverlay();
      }
    };

    // Hàm để xử lý click vào link trong mega menu
    const handleMegaMenuLinkClick = () => {
      setIsOpen(false); // Đóng panel mega menu của mục cha này
      if (onHideOverlay) {
        onHideOverlay(); // Đóng lớp overlay toàn cục
      }
    };

    return (
      <div
        className="group flex h-full items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={categoryLinkHref}
          onClick={handleMegaMenuLinkClick}
          className={classNames(
            "flex items-center rounded-ss-md rounded-se-md px-3 py-2 text-sm font-medium whitespace-nowrap",
            // Thay đổi màu cho navbar nền sáng
            "text-gray-700 hover:bg-gray-100 focus:bg-gray-100",
            { "bg-gray-100 text-gray-900": isOpen }, // Active state khi mega menu mở
          )}
        >
          {localizedCategoryName.toUpperCase()}
          <FiChevronDown
            className={`ml-1 h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </Link>

        {/* Mega Menu Panel */}
        {isOpen && (
          <div
            className={classNames(
              "absolute top-full right-0 left-0",
              "z-30 bg-gray-100 text-gray-700 shadow-lg",
              "scale-100 transform opacity-100 transition-all duration-150 ease-out",
            )}
          >
            {/* Container nội dung của mega menu, căn giữa */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Sử dụng Flexbox cho layout chính: Cột "Tất cả..." và khu vực các cột con */}
              <div className="flex flex-col gap-x-8 gap-y-6 md:flex-row">
                {/* Column 1: General links (Tất cả, Sản phẩm mới, Bán chạy nhất) */}
                <div className="w-full flex-shrink-0 space-y-3 md:w-1/4 md:border-r md:border-gray-200 md:pr-6">
                  <Link
                    href={categoryLinkHref}
                    onClick={handleMegaMenuLinkClick}
                    className="group/link flex items-center text-base font-bold text-gray-800 hover:text-indigo-700"
                  >
                    {t("all", { categoryName: localizedCategoryName })}
                    <FiChevronRight className="ml-1.5 h-4 w-4 opacity-0 transition-opacity group-hover/link:opacity-100" />
                  </Link>
                  <Link
                    href={`/products?category=${category.slug}&sortBy=createdAt&sortOrder=desc`}
                    onClick={handleMegaMenuLinkClick}
                    className="block text-sm text-gray-600 hover:text-indigo-700 hover:underline"
                  >
                    {t("newProducts")}
                  </Link>
                  <Link
                    href={`/products?category=${category.slug}&sortBy=totalSold&sortOrder=desc`}
                    onClick={handleMegaMenuLinkClick}
                    className="block text-sm text-gray-600 hover:text-indigo-700 hover:underline"
                  >
                    {t("bestSellers")}
                  </Link>
                </div>

                {/* Container cho các cột danh mục con (Áo, Quần,...) */}
                {/* Bên trong dùng grid để sắp xếp các cột con này */}
                <div className="flex-grow">
                  {category.children && category.children.length > 0 ? (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {/* Lặp qua các danh mục con cấp 1 (Áo, Quần,...) để tạo cột */}
                      {category.children.map((subCategory1) => (
                        <div key={subCategory1._id} className="space-y-2.5">
                          <Link
                            href={`/products?category=${subCategory1.slug}`}
                            onClick={handleMegaMenuLinkClick}
                            className="group/link flex items-center text-base font-bold text-gray-800 hover:text-indigo-700"
                          >
                            {getLocalizedName(subCategory1.name)}
                            <FiChevronRight className="ml-1.5 h-4 w-4 opacity-0 transition-opacity group-hover/link:opacity-100" />
                          </Link>
                          <ul className="space-y-1.5">
                            {subCategory1.children?.map((subCategory2) => (
                              <li key={subCategory2._id}>
                                <Link
                                  href={`/products?category=${subCategory2.slug}`}
                                  onClick={handleMegaMenuLinkClick}
                                  className="block text-sm text-gray-600 hover:text-indigo-700 hover:underline"
                                >
                                  {getLocalizedName(subCategory2.name)}
                                </Link>
                              </li>
                            ))}
                            {/* Link "Xem tất cả" cho subCategory1
                            {subCategory1.children && subCategory1.children.length > 0 && (
                               <li>
                                  <Link
                                    href={`/products?category=${subCategory1.slug}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block text-sm text-gray-500 hover:text-indigo-700 hover:underline italic mt-1"
                                  >
                                    Xem tất cả {subCategory1.name.toLowerCase()}
                                  </Link>
                                </li>
                            )} */}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t("noSubcategories")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Case 2: DESKTOP - TOP LEVEL (level 0) - KHÔNG CÓ CON -> Link thường
  if (!isMobile && level === 0 && !hasChildren) {
    return (
      <Link
        href={categoryLinkHref}
        className="rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
      >
        {localizedCategoryName.toUpperCase()}
      </Link>
    );
  }

  // Case 2: DESKTOP - TOP LEVEL (level 0) - KHÔNG CÓ CON -> Link thường
  if (!isMobile && level === 0 && !hasChildren) {
    return (
      <Link
        href={categoryLinkHref}
        className="rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-gray-700 focus:bg-gray-700"
      >
        {localizedCategoryName.toUpperCase()}
      </Link>
    );
  }

  // Case 3: MOBILE MENU ITEMS hoặc DESKTOP SUB-MENU ITEMS (dropdown thường trong mega menu, nếu có cấp 3+)
  // Hoặc logic cũ của bạn cho mobile và submenu desktop
  return (
    <div className="w-full">
      <Link
        href={categoryLinkHref}
        onClick={handleSimpleClick} // Sử dụng logic click đơn giản cho mobile/submenu
        className={classNames(
          "flex w-full items-center rounded-md px-3 py-2 text-left text-sm whitespace-nowrap",
          {
            "font-semibold text-gray-900 hover:bg-gray-100": isMobile,
            // Cho submenu desktop (nếu có cấp 3+)
            "font-medium text-gray-700 hover:bg-gray-100":
              !isMobile && level > 0,
            "justify-between": hasChildren,
          },
        )}
      >
        <span>{localizedCategoryName}</span>
        {hasChildren &&
          (isOpen ? (
            <FiChevronDown className="h-4 w-4" />
          ) : (
            <FiChevronRight className="h-4 w-4" />
          ))}
      </Link>

      {hasChildren && isOpen && (isMobile || (!isMobile && level > 0)) && (
        <div className="mt-1 space-y-1 pl-4">
          <Link
            href={categoryLinkHref}
            onClick={() => {
              handleNavigateToParent();
              setIsOpen(false); // Đóng submenu cha khi click "Tất cả"
            }}
            className={classNames(
              "flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-semibold",
              {
                "text-gray-900 hover:bg-gray-100": isMobile,
                "text-gray-700 hover:bg-gray-100": !isMobile && level > 0,
              },
            )}
          >
            Tất cả {localizedCategoryName}
          </Link>
          {category.children?.map((child) => (
            <CategoryMenuItem
              key={child._id}
              category={child}
              level={level + 1}
              isMobile={isMobile}
              onNavigate={onNavigate} // Truyền onNavigate xuống
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryMenuItem;
