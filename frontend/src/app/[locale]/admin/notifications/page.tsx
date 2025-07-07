import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminNotificationsClient from "./AdminNotificationsClient";

export const metadata: Metadata = {
  title: "Tất cả thông báo | Admin Serein Shop",
};

export default function AdminNotificationsPage() {
  return (
    <div>
      <PageHeader
        title="Tất cả thông báo"
        description="Xem lại lịch sử các thông báo đã nhận."
      />
      <AdminNotificationsClient />
    </div>
  );
}
