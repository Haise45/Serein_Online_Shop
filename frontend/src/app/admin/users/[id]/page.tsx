import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminUserDetailClient from "./AdminUserDetailClient";

export const metadata: Metadata = {
  title: "Chi tiết Người dùng | Admin Serein Shop",
};

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
    const { id } = await params;
    
  return (
    <div>
      <PageHeader
        title="Chi tiết Người dùng"
        description="Xem thông tin cá nhân và lịch sử mua hàng của người dùng."
      />
      <AdminUserDetailClient userId={id} />
    </div>
  );
}
