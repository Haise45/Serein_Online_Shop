"use client";

import "@coreui/coreui/dist/css/coreui.min.css";
import { CSpinner } from "@coreui/react";
import { usePathname, useRouter } from "next/navigation";
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
import { logout, setAuthIsLoading, setUser } from "@/store/slices/authSlice";
import { BreadcrumbItem } from "@/types";
import { generateAdminBreadcrumbs } from "@/utils/adminBreadcrumbs";
import { useQueryClient } from "@tanstack/react-query";

// Constants for localStorage keys
const SIDEBAR_VISIBLE_KEY = "admin_sidebar_visible";
const SIDEBAR_UNFOLDABLE_KEY = "admin_sidebar_unfoldable";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const {
    isAuthenticated,
    user,
    isLoading: authStateIsLoading,
    accessToken,
  } = useSelector((state: RootState) => state.auth);

  // State riêng cho layout để không phụ thuộc hoàn toàn vào Redux isLoading cho lần check đầu
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [unfoldable, setUnfoldable] = useState(false);
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);
  const dynamicData = useSelector(
    (state: RootState) => state.breadcrumbAdmin.dynamicData,
  );

  // Load sidebar state from localStorage on component mount
  useEffect(() => {
    const savedSidebarVisible = localStorage.getItem(SIDEBAR_VISIBLE_KEY);
    const savedUnfoldable = localStorage.getItem(SIDEBAR_UNFOLDABLE_KEY);

    if (savedSidebarVisible !== null) {
      setSidebarVisible(JSON.parse(savedSidebarVisible));
    }
    if (savedUnfoldable !== null) {
      setUnfoldable(JSON.parse(savedUnfoldable));
    }
  }, []);

  // Save sidebar visible state to localStorage whenever it changes
  const handleSidebarVisibleChange = (visible: boolean) => {
    setSidebarVisible(visible);
    localStorage.setItem(SIDEBAR_VISIBLE_KEY, JSON.stringify(visible));
  };

  // Save unfoldable state to localStorage whenever it changes
  const handleUnfoldableChange = (unfoldableState: boolean) => {
    setUnfoldable(unfoldableState);
    localStorage.setItem(
      SIDEBAR_UNFOLDABLE_KEY,
      JSON.stringify(unfoldableState),
    );
  };

  useEffect(() => {
    document.title = "Trang Quản Trị | Serein Shop";
  }, []);

  useEffect(() => {
    const verifyAndFetchUser = async () => {
      if (!accessToken) {
        toast.error(
          "Không tìm thấy token xác thực, chuyển hướng đến trang đăng nhập",
        );
        router.replace("/login?redirect=/admin/dashboard");
        return;
      }

      // Nếu có token nhưng chưa có user object trong Redux
      if (!user) {
        dispatch(setAuthIsLoading(true));
        try {
          toast.loading("Đang xác thực thông tin người dùng...", {
            id: "auth-loading",
          });
          const profile = await getMyProfile();
          if (profile.role !== "admin") {
            toast.error("Bạn không có quyền truy cập trang quản trị");
            dispatch(logout());
            queryClient.clear();
            router.replace("/login");
            return;
          }
          dispatch(setUser(profile));
          toast.success("Xác thực thành công!", { id: "auth-loading" });
        } catch {
          toast.error("Lỗi xác thực thông tin, vui lòng đăng nhập lại", {
            id: "auth-loading",
          });
          dispatch(logout());
          queryClient.clear();
          router.replace("/login");
          return;
        } finally {
          dispatch(setAuthIsLoading(false));
        }
      } else if (user.role !== "admin") {
        toast.error("Bạn không có quyền truy cập trang quản trị");
        dispatch(logout());
        queryClient.clear();
        router.replace("/login");
        return;
      }
      setIsVerifyingAuth(false);
    };

    verifyAndFetchUser();
  }, [accessToken, user, dispatch, router, queryClient]);

  // Cập nhật breadcrumbs khi pathname hoặc user thay đổi
  useEffect(() => {
    if (pathname && isAuthenticated && user?.role === "admin") {
      setBreadcrumbItems(generateAdminBreadcrumbs(pathname, dynamicData));
    } else if (!isAuthenticated) {
      setBreadcrumbItems([]);
    }
  }, [pathname, isAuthenticated, user, dynamicData]);

  if (isVerifyingAuth || authStateIsLoading) {
    return (
      <div className="bg-light flex min-h-screen items-center justify-center">
        <CSpinner color="primary" size="sm" />
        <p className="ml-3 text-lg">Đang tải và xác thực...</p>
      </div>
    );
  }

  // Sau khi isVerifyingAuth là false, kiểm tra lại lần nữa
  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  // Tính toán margin-left cho content wrapper dựa trên trạng thái sidebar
  const getContentMarginLeft = () => {
    if (!sidebarVisible) return "0";
    if (unfoldable) return "56px"; // Sidebar collapsed width
    return "256px"; // Sidebar full width
  };

  return (
    // [FIX] Đã xóa className="d-flex". Container này chỉ cần là một div đơn giản.
    // Layout sẽ được xử lý bằng position:fixed cho sidebar và margin-left cho wrapper.
    <div>
      {/* Sidebar với position fixed */}
      <AdminSidebar
        sidebarVisible={sidebarVisible}
        onVisibleChange={handleSidebarVisibleChange}
        unfoldable={unfoldable}
        onUnfoldableChange={handleUnfoldableChange}
      />

      {/* Container cho phần nội dung chính với margin-left động */}
      <div
        // [FIX] Đã xóa flex-grow-1 vì parent không còn là flex container.
        className="wrapper d-flex flex-column bg-light"
        style={{
          marginLeft: getContentMarginLeft(),
          transition: "margin-left 0.15s ease-in-out",
          minWidth: 0,
          // [FIX] Thêm minHeight để đảm bảo wrapper luôn chiếm toàn bộ chiều cao màn hình.
          minHeight: "100vh",
        }}
      >
        <AdminHeader
          onSidebarToggle={() => handleSidebarVisibleChange(!sidebarVisible)}
          onUnfoldableToggle={() => handleUnfoldableChange(!unfoldable)}
        />

        <AdminBreadcrumb items={breadcrumbItems} />

        {/* [FIX] Đã xóa min-h-screen vì wrapper đã có minHeight và body có flex-grow-1. */}
        <div className="body flex-grow-1 px-3" style={{ overflowY: "auto" }}>
          {children}
        </div>

        <AdminFooter />
      </div>
    </div>
  );
}
