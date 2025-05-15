import Breadcrumbs from "@/components/shared/Breadcrumbs";
import RegisterPageClient from "./RegisterPageClient";
import type { Metadata } from "next";
import { BreadcrumbItem } from "@/types";

export const metadata: Metadata = {
  title: "Đăng Ký Tài Khoản | Serein Shop",
  description:
    "Tạo tài khoản mới tại Serein Shop để nhận nhiều ưu đãi hấp dẫn.",
};

export default function RegisterPageContainer() {
    const breadcrumbItems: BreadcrumbItem[] = [
      // { label: 'Trang chủ', href: '/' }, // Sẽ được tự động thêm nếu showHomeIcon=true
      { label: "Đăng Ký", isCurrent: true }, // Trang hiện tại
    ];
  
    return (
      <div className="mx-auto px-0 lg:px-10">
        <Breadcrumbs items={breadcrumbItems} />
        <RegisterPageClient />
      </div>
    );
}
