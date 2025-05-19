"use client";

import { Category } from "@/types";
import classNames from "classnames";
import CategoryMenuItem from "./CategoryMenuItem"; // Import component con

interface CategoryMenuProps {
  categories: (Category & { children?: Category[] })[];
  isMobile?: boolean;
  onLinkClick?: () => void; // Callback khi một link điều hướng thực sự được click (để đóng Sidedrawer)
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({
  categories,
  isMobile = false,
  onLinkClick,
}) => {
  if (!categories || categories.length === 0) return null;

  return (
    <nav
      className={classNames(
        isMobile ? "space-y-1" : "hidden md:flex md:space-x-1", // Giảm space-x cho Navbar desktop một chút
      )}
    >
      {categories.map((category) => (
        <CategoryMenuItem
          key={category._id}
          category={category}
          level={0}
          isMobile={isMobile}
          // Chỉ truyền onLinkClick nếu là mobile, để đóng Sidedrawer
          onNavigate={isMobile ? onLinkClick : undefined}
        />
      ))}
    </nav>
  );
};

export default CategoryMenu;
