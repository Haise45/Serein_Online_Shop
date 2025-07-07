"use client";

import "@coreui/coreui/dist/css/coreui.min.css";
import { CSpinner } from "@coreui/react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import "simplebar/dist/simplebar.min.css";

import AdminBreadcrumb from "@/components/admin/layout/AdminBreadcrumb";
import AdminFooter from "@/components/admin/layout/AdminFooter";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import { getMyProfile } from "@/services/authService";
import { AppDispatch, RootState } from "@/store";
import { logout, setUser } from "@/store/slices/authSlice";
import { BreadcrumbItem } from "@/types";
import { generateAdminBreadcrumbs } from "@/utils/adminBreadcrumbs";

// Constants for localStorage keys
const SIDEBAR_VISIBLE_KEY = "admin_sidebar_visible";
const SIDEBAR_UNFOLDABLE_KEY = "admin_sidebar_unfoldable";

/**
 * Component Guard: Chịu trách nhiệm xác thực, hiển thị loading, và chuyển hướng.
 * Component này sẽ render children (AdminLayoutContent) chỉ khi user hợp lệ.
 */
function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, accessToken } = useSelector(
    (state: RootState) => state.auth,
  );
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      // 1. Nếu không có token, chuyển hướng ngay lập tức
      if (!accessToken) {
        toast.error("Yêu cầu đăng nhập để truy cập trang quản trị.");
        window.location.replace("/login?redirect=/admin/dashboard");
        // Không cần set isVerifying thành false, vì trang sẽ được thay thế
        return;
      }

      // 2. Nếu có token nhưng chưa có thông tin user trong Redux, hoặc user hiện tại không phải admin
      if (!user || user.role !== "admin") {
        try {
          const profile = await getMyProfile();
          if (profile.role !== "admin") {
            toast.error("Bạn không có quyền truy cập trang quản trị.");
            dispatch(logout());
            queryClient.clear();
            window.location.replace("/login");
            return;
          }
          dispatch(setUser(profile));
        } catch {
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          dispatch(logout());
          queryClient.clear();
          window.location.replace("/login");
          return;
        }
      }

      // 3. Nếu mọi thứ ổn, cho phép hiển thị nội dung
      setIsVerifying(false);
    };

    verifyUser();
  }, [accessToken, user, dispatch, queryClient]);

  // Trong khi đang xác thực, hiển thị một màn hình tải duy nhất
  if (isVerifying) {
    return (
      <div className="bg-light flex min-h-screen items-center justify-center">
        <CSpinner color="primary" className="mr-3" />
        <p className="m-0 text-lg">Đang tải và xác thực...</p>
      </div>
    );
  }

  // Sau khi xác thực, nếu user vẫn không hợp lệ (trường hợp hiếm), không hiển thị gì cả.
  // Việc chuyển hướng đã được xử lý trong useEffect.
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  // Nếu hợp lệ, hiển thị layout và nội dung trang
  return <>{children}</>;
}

/**
 * Component Layout: Chịu trách nhiệm hiển thị cấu trúc UI (Sidebar, Header, etc).
 * Component này có thể giả định rằng nó chỉ được render khi user đã được xác thực là admin.
 */
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dynamicData = useSelector(
    (state: RootState) => state.breadcrumbAdmin.dynamicData,
  );

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [unfoldable, setUnfoldable] = useState(false);
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);

  // Load và save trạng thái sidebar từ/vào localStorage
  useEffect(() => {
    const savedVisible = localStorage.getItem(SIDEBAR_VISIBLE_KEY);
    const savedUnfoldable = localStorage.getItem(SIDEBAR_UNFOLDABLE_KEY);
    if (savedVisible !== null) setSidebarVisible(JSON.parse(savedVisible));
    if (savedUnfoldable !== null) setUnfoldable(JSON.parse(savedUnfoldable));
  }, []);

  const handleSidebarVisibleChange = (visible: boolean) => {
    setSidebarVisible(visible);
    localStorage.setItem(SIDEBAR_VISIBLE_KEY, JSON.stringify(visible));
  };

  const handleUnfoldableChange = (unfoldableState: boolean) => {
    setUnfoldable(unfoldableState);
    localStorage.setItem(
      SIDEBAR_UNFOLDABLE_KEY,
      JSON.stringify(unfoldableState),
    );
  };

  // Cập nhật breadcrumbs khi đường dẫn thay đổi
  useEffect(() => {
    document.title = "Trang Quản Trị | Serein Shop";
    setBreadcrumbItems(generateAdminBreadcrumbs(pathname, dynamicData));
  }, [pathname, dynamicData]);

  // Tính toán margin cho nội dung
  const getContentMarginLeft = () => {
    if (!sidebarVisible) return "0";
    return unfoldable ? "56px" : "256px";
  };

  return (
    <div>
      <AdminSidebar
        sidebarVisible={sidebarVisible}
        onVisibleChange={handleSidebarVisibleChange}
        unfoldable={unfoldable}
        onUnfoldableChange={handleUnfoldableChange}
      />
      <div
        className="wrapper d-flex flex-column bg-light"
        style={{
          marginLeft: getContentMarginLeft(),
          transition: "margin-left 0.15s ease-in-out",
          minWidth: 0,
          minHeight: "100vh",
        }}
      >
        <AdminHeader
          onSidebarToggle={() => handleSidebarVisibleChange(!sidebarVisible)}
          onUnfoldableToggle={() => handleUnfoldableChange(!unfoldable)}
        />
        <AdminBreadcrumb items={breadcrumbItems} />
        <div className="body flex-grow-1 px-3" style={{ overflowY: "auto" }}>
          {children}
        </div>
        <AdminFooter />
      </div>
    </div>
  );
}

/**
 * Component export chính, kết hợp Guard và Layout.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthGuard>
  );
}
