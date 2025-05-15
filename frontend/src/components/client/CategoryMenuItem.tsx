// components/Layout/CategoryMenuItem.tsx
"use client";

import { Category } from "@/types";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // Thêm useEffect
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

interface CategoryMenuItemProps {
  category: Category & { children?: Category[] };
  level?: number;
  isMobile?: boolean;
  onNavigate?: () => void;
}

const CategoryMenuItem: React.FC<CategoryMenuItemProps> = ({
  category,
  level = 0,
  isMobile = false,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // State mới để theo dõi xem submenu đã được mở ít nhất một lần kể từ khi menu cha được hiển thị
  // hoặc kể từ khi menu này được render lại (ví dụ, khi isMobile thay đổi)
  const [hasBeenOpenedOnce, setHasBeenOpenedOnce] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const router = useRouter();

  const categoryLinkHref = `/products?category=${category.slug}`;

  // Reset hasBeenOpenedOnce nếu item bị đóng từ bên ngoài hoặc component re-render
  // mà không phải do người dùng chủ động đóng.
  // Quan trọng: khi isOpen trở thành false, reset hasBeenOpenedOnce để lần mở tiếp theo là "lần 1"
  useEffect(() => {
    if (!isOpen) {
      setHasBeenOpenedOnce(false);
    }
  }, [isOpen]);

  const handleItemClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault(); // Ngăn chặn hành vi mặc định của Link ở mọi trường hợp ban đầu

    if (hasChildren) {
      // Logic cho item CÓ CON
      if (isMobile || (!isMobile && level > 0)) {
        // Áp dụng cho Mobile và Desktop Submenu
        if (!isOpen) {
          // Click lần 1 (hoặc click khi đang đóng): Mở submenu
          setIsOpen(true);
          setHasBeenOpenedOnce(true); // Đánh dấu đã mở 1 lần
        } else {
          // Submenu đang mở
          if (hasBeenOpenedOnce) {
            // Click lần 2 (hoặc click tiếp theo khi submenu đã từng được mở): Điều hướng
            router.push(categoryLinkHref);
            if (onNavigate) {
              onNavigate();
            }
            // Tùy chọn: đóng lại submenu sau khi điều hướng
            // setIsOpen(false);
            // setHasBeenOpenedOnce(false); // Reset để lần sau lại là click 1
          } else {
            // Trường hợp này ít xảy ra nếu useEffect ở trên hoạt động đúng,
            // nhưng để an toàn, nếu đang mở mà chưa "opened once", thì chỉ mở và đánh dấu.
            setHasBeenOpenedOnce(true);
          }
        }
      } else if (!isMobile && level === 0) {
        // Desktop Navbar, Cấp 1, CÓ CON:
        // Logic này sẽ không được kích hoạt vì chúng ta dùng span và onMouseEnter/Leave
        // Nếu bạn thay đổi thành click-to-toggle cho Desktop Cấp 1, bạn cần điều chỉnh ở đây
        // Ví dụ:
        // if (!isOpen) {
        //   setIsOpen(true);
        //   setHasBeenOpenedOnce(true);
        // } else {
        //   router.push(categoryLinkHref);
        //   if (onNavigate) onNavigate();
        // }
      }
    } else {
      // Logic cho item KHÔNG CÓ CON: Luôn điều hướng
      router.push(categoryLinkHref);
      if (onNavigate) {
        onNavigate();
      }
    }
  };

  // --- RENDER LOGIC ---

  // Case 1: Desktop Navbar - Mục Cấp 1 - CÓ CON (ví dụ: "ÁO", "QUẦN")
  // Vẫn sử dụng hover để mở cho trường hợp này, không áp dụng logic click 1 / click 2.
  // Nếu muốn áp dụng, bạn cần thay đổi span này thành button/Link và gọi handleItemClick.
  if (!isMobile && level === 0 && hasChildren) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => {
          setIsOpen(false);
          // setHasBeenOpenedOnce(false); // Reset khi chuột rời đi, để lần hover sau lại là mới
        }}
      >
        <span className="flex cursor-default items-center rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-gray-700 hover:text-white">
          {category.name}
          <FiChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
        </span>
        {isOpen && (
          <div className="ring-opacity-5 absolute left-0 z-20 mt-0 w-56 origin-top-left rounded-md bg-white py-1 shadow-lg focus:outline-none">
            {category.children?.map((child) => (
              <CategoryMenuItem
                key={child._id}
                category={child}
                level={level + 1}
                isMobile={false}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Case 2: Các trường hợp còn lại (Mobile, Desktop Submenu, Desktop Cấp 1 KHÔNG CON)
  // Nơi logic click 1 / click 2 sẽ áp dụng (chủ yếu cho mobile và desktop submenu có con)
  return (
    <div className="w-full">
      <Link
        href={categoryLinkHref} // href vẫn cần cho SEO và chuột phải mở tab mới
        onClick={handleItemClick} // Logic click tùy chỉnh
        className={classNames(
          "flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium whitespace-nowrap",
          {
            "text-gray-900 hover:bg-gray-100": isMobile,
            "text-white hover:bg-gray-700 hover:text-white":
              !isMobile && level === 0,
            "text-gray-700 hover:bg-gray-100": !isMobile && level > 0,
            "justify-between":
              hasChildren && (isMobile || (!isMobile && level > 0)),
          },
        )}
      >
        <span>{category.name}</span>
        {hasChildren &&
          (isMobile || (!isMobile && level > 0)) &&
          (isOpen ? (
            <FiChevronDown className="h-4 w-4" />
          ) : (
            <FiChevronRight className="h-4 w-4" />
          ))}
      </Link>

      {hasChildren && isOpen && (isMobile || (!isMobile && level > 0)) && (
        <div className="mt-1 space-y-1 pl-4">
          {category.children?.map((child) => (
            <CategoryMenuItem
              key={child._id}
              category={child}
              level={level + 1}
              isMobile={isMobile}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryMenuItem;
