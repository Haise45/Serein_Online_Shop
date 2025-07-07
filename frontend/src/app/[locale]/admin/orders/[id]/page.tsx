import PageHeader from "@/components/shared/PageHeader";
import type { Metadata } from "next";
import AdminOrderDetailClient from "./AdminOrderDetailClient";

export const metadata: Metadata = {
  title: "Chi tiết Đơn hàng | Admin Serein Shop",
  description: "Xem chi tiết, cập nhật trạng thái và xử lý đơn hàng.",
};

// Interface để định nghĩa props cho page, bao gồm params từ URL động
interface AdminOrderDetailPageProps {
  params: Promise<{
    id: string; // id của đơn hàng sẽ được truyền vào đây
  }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params; // Lấy ID đơn hàng từ params

  return (
    <div>
      <PageHeader
        title={`Chi tiết Đơn hàng #${id.slice(-6).toUpperCase()}`}
        description="Xem thông tin chi tiết, cập nhật trạng thái và xử lý các yêu cầu của khách hàng."
      />
      {/* Truyền orderId vào component Client để nó fetch dữ liệu và hiển thị */}
      <AdminOrderDetailClient orderId={id} />
    </div>
  );
}
