import Breadcrumbs from "@/components/shared/Breadcrumbs"; // Import component Breadcrumbs
import { BreadcrumbItem } from "@/types";
import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Đăng Nhập | Serein Shop",
  description:
    "Đăng nhập vào tài khoản Serein Shop của bạn để tiếp tục mua sắm và quản lý đơn hàng.",
  // Thêm các thẻ meta khác nếu cần
  // openGraph: {
  //   title: 'Đăng Nhập - Serein Shop',
  //   description: 'Đăng nhập vào tài khoản Serein Shop của bạn.',
  // },
};

export default function LoginPageContainer() {
  const breadcrumbItems: BreadcrumbItem[] = [
    // { label: 'Trang chủ', href: '/' }, // Sẽ được tự động thêm nếu showHomeIcon=true
    { label: "Đăng Nhập", isCurrent: true }, // Trang hiện tại
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <LoginPageClient />
    </div>
  );
}
