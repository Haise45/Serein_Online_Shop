"use client";

import { Category } from "@/types";
import classNames from "classnames";
import CategoryMenuItem from "./CategoryMenuItem";

interface CategoryMenuProps {
  categories: (Category & { children?: Category[] })[];
  isMobile?: boolean;
  onLinkClick?: () => void; // Callback khi một link điều hướng thực sự được click (để đóng Sidedrawer)
  className?: string; // Cho phép truyền class tùy chỉnh từ NavbarClient
  onShowOverlay?: () => void;
  onHideOverlay?: () => void;
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({
  categories,
  isMobile = false,
  onLinkClick,
  className,
  onShowOverlay,
  onHideOverlay,
}) => {
  if (!categories || categories.length === 0) return null;

  return (
    <nav
      className={classNames(
        className, // Sử dụng class được truyền vào
        isMobile ? "space-y-1" : "hidden md:flex md:space-x-1",
      )}
    >
      {categories.map((category) => (
        <CategoryMenuItem
          key={category._id}
          category={category}
          level={0} // Các mục trong CategoryMenu này luôn là level 0 đối với chính nó
          isMobile={isMobile}
          onNavigate={isMobile ? onLinkClick : undefined} // onNavigate chủ yếu cho mobile
          onShowOverlay={onShowOverlay}
          onHideOverlay={onHideOverlay}
        />
      ))}
    </nav>
  );
};

export default CategoryMenu;
