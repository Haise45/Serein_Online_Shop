import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Thống kê số liệu | Admin Serein Shop",
};

export default function AdminDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Thống kê số liệu"
        description="Tổng quan về hoạt động kinh doanh của cửa hàng."
      />
      <AdminDashboardClient />
    </div>
  );
}