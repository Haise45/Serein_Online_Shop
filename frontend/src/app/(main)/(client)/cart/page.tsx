import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import type { Metadata } from "next";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = {
  title: "Giỏ Hàng Của Bạn | Serein Shop",
  description: "Xem lại sản phẩm trong giỏ hàng và tiến hành thanh toán tại Serein Shop.",
};

export default async function CartPageContainer() {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Trang Chủ", href: "/" },
    { label: "Giỏ Hàng", isCurrent: true },
  ];

  return (
    <div className="bg-gray-100">
      <div className="mx-auto px-0 lg:px-10">
        <Breadcrumbs items={breadcrumbItems} />
        <CartPageClient />
      </div>
    </div>
  );
}