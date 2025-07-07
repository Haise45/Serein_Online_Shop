import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminSettingsClient from "./AdminSettingsClient";

export const metadata: Metadata = {
  title: "Cài đặt Cửa hàng | Admin Serein Shop",
  description: "Quản lý các cấu hình chung cho trang web và trang quản trị."
};

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Cài đặt Cửa hàng"
        description="Thay đổi các cấu hình chung ảnh hưởng đến toàn bộ trang web."
      />
      <AdminSettingsClient />
    </div>
  );
}