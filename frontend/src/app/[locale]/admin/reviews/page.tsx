import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminReviewsClient from "./AdminReviewsClient";

export const metadata: Metadata = {
  title: "Quản lý Đánh giá | Admin Serein Shop",
};

export default function AdminReviewsPage() {
  return (
    <div>
      <PageHeader
        title="Quản lý Đánh giá"
        description="Duyệt, phản hồi và quản lý tất cả các đánh giá của khách hàng."
      />
      <AdminReviewsClient />
    </div>
  );
}
