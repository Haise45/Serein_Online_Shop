import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import type { Metadata } from "next";
import ForgotPasswordPageClient from "./ForgotPasswordPageClient";

export const metadata: Metadata = {
  title: "Quên Mật Khẩu | Serein Shop",
  description: "Yêu cầu đặt lại mật khẩu cho tài khoản Serein Shop của bạn.",
};

export default function ForgotPasswordPageContainer() {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Đăng Nhập", href: "/login" },
    { label: "Quên Mật Khẩu", isCurrent: true },
  ];
  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <ForgotPasswordPageClient />
    </div>
  );
}
