import type { Metadata } from "next";
import AdminOrdersClient from "./AdminOrdersClient";
import PageHeader from "@/components/shared/PageHeader";

// Metadata cho trang quản lý đơn hàng
export const metadata: Metadata = {
  title: "Quản lý Đơn hàng | Admin Serein Shop",
  description: "Xem và quản lý tất cả các đơn hàng của cửa hàng.",
};

export default function AdminOrdersPage() {
  return (
    <div>
      <PageHeader
        title="Danh sách Đơn hàng"
        description="Quản lý và theo dõi tất cả đơn hàng trong hệ thống."
      />
      <AdminOrdersClient /> {/* Render component client */}
    </div>
  );
}
