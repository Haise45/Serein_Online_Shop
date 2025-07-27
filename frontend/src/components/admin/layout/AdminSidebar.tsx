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
import classNames from "classnames";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/navigation";
import React, { useEffect, useState } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

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
  const t = useTranslations("Admin.sidebar");
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  const adminNavigation = [
    {
      component: CNavItem,
      name: "dashboard", // Key
      to: "/admin/dashboard",
      icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    },
    { component: CNavTitle, name: "manageShop" }, // Key
    {
      component: CNavGroup,
      name: "productsGroup", // Key
      icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
      items: [
        { component: CNavItem, name: "allProducts", to: "/admin/products" }, // Key
        {
          component: CNavItem,
          name: "addNewProduct",
          to: "/admin/products/create",
        }, // Key
        { component: CNavItem, name: "categories", to: "/admin/categories" }, // Key
        { component: CNavItem, name: "attributes", to: "/admin/attributes" }, // Key
      ],
    },
    {
      component: CNavItem,
      name: "orders",
      to: "/admin/orders",
      icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: "users",
      to: "/admin/users",
      icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: "coupons",
      to: "/admin/coupons",
      icon: <CIcon icon={cilTags} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: "reviews",
      to: "/admin/reviews",
      icon: <CIcon icon={cilCommentSquare} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: "reports",
      to: "/admin/reports",
      icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    },
    { component: CNavTitle, name: "system" }, // Key
    {
      component: CNavItem,
      name: "shopSettings",
      to: "/admin/settings",
      icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    },
  ];

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
      const translatedName = t(item.name as string);
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
                {translatedName}
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
              {translatedName}
            </Link>
          </CNavItem>
        );
      }

      if (isNavTitle(item)) {
        return <CNavTitle key={key}>{translatedName}</CNavTitle>;
      }

      return (
        <CNavItem key={key}>
          {item.icon}
          {translatedName}
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
