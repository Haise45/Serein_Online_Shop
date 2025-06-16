import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminProductEditClient from "./AdminProductEditClient";

export const metadata: Metadata = {
  title: "Chỉnh sửa Sản phẩm | Admin Serein Shop",
};

interface AdminProductEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminProductEditPage({
  params,
}: AdminProductEditPageProps) {
  const { id } = await params;

  return (
    <div>
      <PageHeader
        title="Chỉnh sửa Sản phẩm"
        description="Cập nhật thông tin chi tiết, biến thể và hình ảnh của sản phẩm."
      />
      {/* Truyền productId vào component Client */}
      <AdminProductEditClient productId={id} />
    </div>
  );
}
