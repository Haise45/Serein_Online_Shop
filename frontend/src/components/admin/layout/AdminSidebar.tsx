"use client";
import "@/app/globals.css";
import {
  cilCart,
  cilChartPie,
  cilCommentSquare,
  cilPuzzle,
  cilSettings,
  cilSpeedometer,
  cilTags,
  cilUser,
} from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CNavGroup,
  CNavItem,
  CNavTitle,
  CSidebar,
  CSidebarNav,
} from "@coreui/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import classNames from "classnames";

// Các định nghĩa type và navigation không đổi...
interface BaseNavItem {
  name: string;
  icon?: React.ReactNode;
}
interface NavItemWithLink extends BaseNavItem {
  component: typeof CNavItem;
  to: string;
}
interface NavItemWithoutLink extends BaseNavItem {
  component: typeof CNavItem;
  to?: never;
}
interface NavGroup extends BaseNavItem {
  component: typeof CNavGroup;
  items: NavigationItem[];
  to?: never;
}
interface NavTitle {
  component: typeof CNavTitle;
  name: string;
  to?: never;
  icon?: never;
}
type NavigationItem =
  | NavItemWithLink
  | NavItemWithoutLink
  | NavGroup
  | NavTitle;

const adminNavigation: NavigationItem[] = [
  {
    component: CNavItem,
    name: "Dashboard",
    to: "/admin/dashboard",
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  { component: CNavTitle, name: "Quản lý Shop" },
  {
    component: CNavGroup,
    name: "Sản phẩm",
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    items: [
      { component: CNavItem, name: "Tất cả sản phẩm", to: "/admin/products" },
      {
        component: CNavItem,
        name: "Thêm sản phẩm mới",
        to: "/admin/products/create",
      },
      { component: CNavItem, name: "Danh mục", to: "/admin/categories" },
      { component: CNavItem, name: "Thuộc tính", to: "/admin/attributes" },
    ],
  },
  {
    component: CNavItem,
    name: "Đơn hàng",
    to: "/admin/orders",
    icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Người dùng",
    to: "/admin/users",
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Mã giảm giá",
    to: "/admin/coupons",
    icon: <CIcon icon={cilTags} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Đánh giá",
    to: "/admin/reviews",
    icon: <CIcon icon={cilCommentSquare} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Thống kê",
    to: "/admin/reports",
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
  },
  { component: CNavTitle, name: "Hệ thống" },
  {
    component: CNavItem,
    name: "Cài đặt Shop",
    to: "/admin/settings/shop",
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
];

interface AdminSidebarProps {
  sidebarVisible: boolean;
  onVisibleChange: (visible: boolean) => void;
  unfoldable: boolean;
  onUnfoldableChange: (unfoldable: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  sidebarVisible,
  onVisibleChange,
  unfoldable,
}) => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isNavItemWithLink = (item: NavigationItem): item is NavItemWithLink => {
    return (
      item.component === CNavItem && "to" in item && typeof item.to === "string"
    );
  };
  const isNavGroup = (item: NavigationItem): item is NavGroup => {
    return item.component === CNavGroup;
  };
  const isNavTitle = (item: NavigationItem): item is NavTitle => {
    return item.component === CNavTitle;
  };

  const renderNavItems = (items: NavigationItem[]): React.ReactNode[] => {
    return items.map((item, index) => {
      const key = `${item.name}-${index}`;

      if (isNavGroup(item)) {
        const isGroupActive = item.items.some(
          (subItem) =>
            isNavItemWithLink(subItem) && pathname.startsWith(subItem.to),
        );

        return (
          <CNavGroup
            key={key}
            className={classNames({
              active: isGroupActive,
            })}
            toggler={
              <>
                {item.icon}
                {item.name}
              </>
            }
            visible={isGroupActive}
          >
            {renderNavItems(item.items)}
          </CNavGroup>
        );
      }

      if (isNavItemWithLink(item)) {
        const isActive = pathname === item.to;

        return (
          <CNavItem key={key} active={isActive}>
            <Link
              href={item.to}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              {item.icon}
              {item.name}
            </Link>
          </CNavItem>
        );
      }

      if (isNavTitle(item)) {
        return <CNavTitle key={key}>{item.name}</CNavTitle>;
      }

      return (
        <CNavItem key={key}>
          {item.icon}
          {item.name}
        </CNavItem>
      );
    });
  };

  return (
    <CSidebar
      position="fixed"
      visible={sidebarVisible}
      onVisibleChange={onVisibleChange}
      unfoldable={unfoldable}
      className="border-end sidebar-fixed"
      colorScheme="dark"
      overlaid={isMobile}
    >
      <CSidebarNav>
        <div className="sidebar-brand flex h-16 items-center justify-center">
          {unfoldable ? (
            <Image
              src="https://res.cloudinary.com/dh7mq8bgc/image/upload/v1746871359/logo_woridg.jpg"
              alt="Serein Logo"
              width={40}
              height={40}
              quality={100}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold">Serein Admin</span>
          )}
        </div>
        <SimpleBar style={{ maxHeight: "calc(100vh - 64px)" }}>
          {renderNavItems(adminNavigation)}
        </SimpleBar>
      </CSidebarNav>
    </CSidebar>
  );
};

export default AdminSidebar;
