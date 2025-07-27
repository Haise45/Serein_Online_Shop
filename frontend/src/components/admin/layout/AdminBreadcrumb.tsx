"use client";
import { BreadcrumbItem as BreadcrumbItemType } from "@/types";
import { CBreadcrumb, CBreadcrumbItem } from "@coreui/react";
import { Link } from "@/i18n/navigation";
import React from "react";

interface AdminBreadcrumbProps {
  items: BreadcrumbItemType[];
}

const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    // Component này được đặt ngay dưới CHeader trong layout
    <header className="px-4 py-3">
      <CBreadcrumb>
        {items.map((item, index) => {
          const isLastItem = index === items.length - 1;

          return (
            <CBreadcrumbItem
              key={index}
              active={isLastItem} // Chỉ item cuối cùng là active
            >
              {/* Nếu không phải item cuối và có href, render Link */}
              {!isLastItem && item.href ? (
                <Link href={item.href} className="text-decoration-none">
                  {item.label}
                </Link>
              ) : (
                // Nếu là item cuối hoặc không có href, chỉ render text
                <span>{item.label}</span>
              )}
            </CBreadcrumbItem>
          );
        })}
      </CBreadcrumb>
    </header>
  );
};

export default AdminBreadcrumb;
