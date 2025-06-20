import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminUsersClient from "./AdminUsersClient";

export const metadata: Metadata = {
  title: "Quản lý Người dùng | Admin Serein Shop",
};

export default function AdminUsersPage() {
  return (
    <div>
      <PageHeader
        title="Danh sách Người dùng"
        description="Quản lý tài khoản khách hàng và quản trị viên."
      />
      <AdminUsersClient />
    </div>
  );
}
