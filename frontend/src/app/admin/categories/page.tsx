import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminCategoriesClient from "./AdminCategoriesClient";

export const metadata: Metadata = {
  title: "Quản lý Danh mục | Admin Serein Shop",
};

export default function AdminCategoriesPage() {
  return (
    <div>
      <PageHeader
        title="Danh sách Danh mục"
        description="Quản lý và tổ chức các danh mục sản phẩm trong cửa hàng."
      />
      <AdminCategoriesClient />
    </div>
  );
}