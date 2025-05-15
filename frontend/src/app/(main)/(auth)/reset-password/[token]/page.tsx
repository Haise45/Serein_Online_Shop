import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import type { Metadata } from "next";
import ResetPasswordPageClient from "./ResetPasswordPageClient";

type Props = {
  params: { token: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Hàm generateMetadata để tạo metadata động
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Đặt Lại Mật Khẩu | Serein Shop`,
    description: "Tạo mật khẩu mới cho tài khoản Serein Shop của bạn.",
    // openGraph: {
    //   images: ['/some-specific-page-image.jpg', ...previousImages],
    // },
    robots: {
      // Không muốn Google index trang reset password với token cụ thể
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

export default function ResetPasswordPageContainer({ params }: Props) {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Đăng Nhập", href: "/login" },
    { label: "Đặt Lại Mật Khẩu", isCurrent: true },
  ];
  // Truyền token xuống Client Component qua props
  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <ResetPasswordPageClient token={params.token} />
    </div>
  );
}
