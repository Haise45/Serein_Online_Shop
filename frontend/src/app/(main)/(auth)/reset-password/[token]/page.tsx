import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import type { Metadata } from "next";
import ResetPasswordPageClient from "./ResetPasswordPageClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Đặt Lại Mật Khẩu | Serein Shop`,
    description: "Tạo mật khẩu mới cho tài khoản Serein Shop của bạn.",
    robots: {
      index: false,
      follow: true,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default async function ResetPasswordPageContainer(
  props: {
    params: Promise<{ token: string }>;
  }
) {
  // await the params promise
  const { token } = await props.params;

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Đăng Nhập", href: "/login" },
    { label: "Đặt Lại Mật Khẩu", isCurrent: true },
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <ResetPasswordPageClient token={token} />
    </div>
  );
}
