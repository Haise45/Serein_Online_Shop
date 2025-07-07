import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminCouponsClient from "./AdminCouponsClient";

export const metadata: Metadata = {
  title: "Quản lý Mã giảm giá | Admin Serein Shop",
};

export default function AdminCouponsPage() {
  return (
    <div>
      <PageHeader
        title="Mã giảm giá"
        description="Tạo và quản lý các chương trình khuyến mãi cho cửa hàng."
      />
      <AdminCouponsClient />
    </div>
  );
}
