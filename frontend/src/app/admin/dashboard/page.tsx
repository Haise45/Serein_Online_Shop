"use client";
import { RootState } from "@/store";
import { CCard, CCardBody, CCardHeader, CCol, CRow } from "@coreui/react";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function AdminDashboardPage() {
  const authUser = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    document.title = "Dashboard | Quản Trị Serein Shop";
  }, []);

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Admin Dashboard</strong>
          </CCardHeader>
          <CCardBody>
            <p>Chào mừng, {authUser?.name || "Admin"}!</p>
            <p>Đây là trang quản trị sử dụng CoreUI.</p>
            {/* Thêm các widget hoặc thông tin khác tại đây */}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
}
