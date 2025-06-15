import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminAttributesClient from "./AdminAttributesClient";

export const metadata: Metadata = {
  title: "Quản lý Thuộc tính | Admin Serein Shop",
};

export default function AdminAttributesPage() {
  return (
    <div>
      <PageHeader
        title="Quản lý Thuộc tính"
        description="Thêm, sửa, xóa các thuộc tính sản phẩm và giá trị của chúng (Màu sắc, Size...)."
      />
      <AdminAttributesClient />
    </div>
  );
}