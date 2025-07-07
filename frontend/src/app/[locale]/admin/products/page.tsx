import type { Metadata } from "next";
import AdminProductsClient from "./AdminProductsClient";
import PageHeader from "@/components/shared/PageHeader";
export const metadata: Metadata = {
  title: "Quản lý Sản phẩm | Admin Serein Shop",
};

export default function AdminProductsPage() {
  return (
    <div>
      <PageHeader
        title="Danh sách Sản phẩm"
        description="Quản lý tất cả sản phẩm trong cửa hàng."
      />
      <AdminProductsClient />
    </div>
  );
}
