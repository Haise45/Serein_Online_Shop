"use client";

import "@coreui/coreui/dist/css/coreui.min.css";
import { CSpinner } from "@coreui/react"; // Ví dụ Spinner
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "simplebar/dist/simplebar.min.css"; // Dependency của CoreUI sidebar

// import AdminHeader from "@/components/admin/AdminHeader"; // Sẽ tạo sau
// import AdminSidebar from "@/components/admin/AdminSidebar"; // Sẽ tạo sau
import { getMyProfile } from "@/services/authService"; // Service lấy profile
import { AppDispatch, RootState } from "@/store";
import { logout, setUser } from "@/store/slices/authSlice"; // setUser để cập nhật info user

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const {
    isAuthenticated,
    user,
    isLoading: authLoading,
    accessToken,
  } = useSelector((state: RootState) => state.auth);
  const [isVerifying, setIsVerifying] = React.useState(true); // State để check auth ban đầu

  useEffect(() => {
    const verifyAuth = async () => {
      // Nếu Redux đã có token và user, kiểm tra vai trò
      if (accessToken && user) {
        if (user.role !== "admin") {
          dispatch(logout()); // Logout nếu không phải admin
          router.replace("/login");
        } else {
          setIsVerifying(false); // Đã xác thực
        }
      }
      // Nếu Redux có token nhưng chưa có user (ví dụ: sau khi F5, token load từ localStorage)
      else if (accessToken && !user) {
        try {
          const profile = await getMyProfile(); // Dùng token từ axios interceptor
          dispatch(setUser(profile)); // Cập nhật user vào Redux
          if (profile.role !== "admin") {
            dispatch(logout());
            router.replace("/login");
          } else {
            setIsVerifying(false);
          }
        } catch (error) {
          console.error(
            "AdminLayout: Error fetching profile, logging out.",
            error,
          );
          dispatch(logout());
          router.replace("/login");
        }
      }
      // Nếu không có token trong Redux
      else {
        router.replace("/login");
        // setIsVerifying(false) sẽ không được gọi ở đây, user sẽ bị redirect
      }
    };

    verifyAuth();
  }, [accessToken, user, dispatch, router]);

  useEffect(() => {
    document.title = "Trang quản Trị | Serein Shop";
  }, []);

  if (isVerifying || authLoading) {
    // Hiển thị loading khi đang xác thực hoặc authSlice đang loading
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CSpinner color="primary" />
        <p className="ml-2">Đang tải và xác thực...</p>
      </div>
    );
  }

  // Chỉ render layout admin nếu đã xác thực và là admin
  if (!isAuthenticated || user?.role !== "admin") {
    // Redirect đã được xử lý trong useEffect, nhưng return null để tránh render sớm
    return null;
  }

  return (
    <div className="c-app c-default-layout">
      {" "}
      {/* Class của CoreUI */}
      {/* <AdminSidebar /> */}
      <div className="c-wrapper">
        {/* <AdminHeader /> */}
        <div className="c-body">
          <main className="c-main">
            <div className="container-fluid">
              {" "}
              {/* Hoặc CContainer từ CoreUI */}
              {children}
            </div>
          </main>
        </div>
        {/* <CFooter>...</CFooter> */}
      </div>
    </div>
  );
}
