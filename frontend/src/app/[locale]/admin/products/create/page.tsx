import PageHeader from "@/components/shared/PageHeader";
import type { Metadata } from "next";
import AdminProductCreateClient from "./AdminProductCreateClient";

export const metadata: Metadata = {
  title: "Thêm sản phẩm mới | Admin Serein Shop",
};

export default function AdminCreateProductPage() {
  return (
    <div>
      <PageHeader
        title="Thêm sản phẩm mới"
        description="Điền thông tin chi tiết để tạo một sản phẩm mới trong cửa hàng."
      />
      <AdminProductCreateClient />
    </div>
  );
}