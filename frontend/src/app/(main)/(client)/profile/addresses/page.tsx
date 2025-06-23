import type { Metadata } from "next";
import UserAddressesClient from "./UserAddressesClient";
import PageHeader from "@/components/shared/PageHeader";

export const metadata: Metadata = {
  title: "Sổ Địa Chỉ | Serein Shop",
  description: "Quản lý các địa chỉ giao hàng của bạn.",
};

export default function UserAddressesPage() {
  return (
    <div>
      <PageHeader
        title="Sổ địa chỉ"
        description="Quản lý các địa chỉ nhận hàng của bạn để đặt hàng nhanh chóng hơn."
      />
      <UserAddressesClient />
    </div>
  );
}
