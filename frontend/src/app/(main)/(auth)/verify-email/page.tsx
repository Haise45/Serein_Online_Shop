import type { Metadata } from 'next';
import VerifyEmailPageClient from './VerifyEmailPageClient';
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";

export const metadata: Metadata = {
  title: 'Xác Thực Email | Serein Shop',
  description: 'Hoàn tất việc xác thực địa chỉ email của bạn.',
};

export default function VerifyEmailPageContainer() {
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Đăng Ký", isCurrent: true},
  ]
  // Truyền searchParams xuống client component nếu cần dùng ở server để tạo metadata động hơn
  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <VerifyEmailPageClient />
    </div>
  );
}