import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminReportsClient from "./AdminReportsClient";

export const metadata: Metadata = {
  title: "Báo cáo & Thống kê | Admin Serein Shop",
};

export default function AdminReportsPage() {
  return (
    <div>
      <PageHeader
        title="Báo cáo & Thống kê"
        description="Phân tích chi tiết về hoạt động kinh doanh của cửa hàng."
      />
      <AdminReportsClient />
    </div>
  );
}
