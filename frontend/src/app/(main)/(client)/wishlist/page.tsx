// src/app/(main)/wishlist/page.tsx
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import type { Metadata } from "next";
import WishlistPageClient from "./WishlistPageClient";

export const metadata: Metadata = {
  title: "Danh Sách Yêu Thích | Serein Shop",
  description: "Xem và quản lý các sản phẩm bạn đã yêu thích tại Serein Shop.",
};

export default async function WishlistPageContainer() {

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Trang Chủ", href: "/" },
    { label: "Danh Sách Yêu Thích", isCurrent: true },
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <WishlistPageClient />
    </div>
  );
}