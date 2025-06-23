import type { Metadata } from "next";
import UserProfileSettingsClient from "./UserProfileSettingsClient";

export const metadata: Metadata = {
  title: "Thông Tin Tài Khoản | Serein Shop",
  description: "Quản lý thông tin cá nhân và cài đặt mật khẩu của bạn",
};

export default function ProfileSettingsPage() {
  return <UserProfileSettingsClient />;
}
