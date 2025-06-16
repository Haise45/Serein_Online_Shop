// src/app/admin/layout.tsx
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
      setBreadcrumbItems(generateAdminBreadcrumbs(pathname));
    } else if (!isAuthenticated) {
      setBreadcrumbItems([]);
    }
  }, [pathname, isAuthenticated, user]);

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
    <div className="d-flex">
      {/* Sidebar với position fixed */}
      <AdminSidebar
        sidebarVisible={sidebarVisible}
        onVisibleChange={handleSidebarVisibleChange}
        unfoldable={unfoldable}
        onUnfoldableChange={handleUnfoldableChange}
      />

      {/* Container cho phần nội dung chính với margin-left động */}
      <div
        className="wrapper d-flex flex-column bg-light flex-grow-1"
        style={{
          marginLeft: getContentMarginLeft(),
          transition: "margin-left 0.15s ease-in-out",
          minWidth: 0,
        }}
      >
        <AdminHeader
          onSidebarToggle={() => handleSidebarVisibleChange(!sidebarVisible)}
          onUnfoldableToggle={() => handleUnfoldableChange(!unfoldable)}
        />

        <AdminBreadcrumb items={breadcrumbItems} />

        {/* Đây là phần body chính, nó sẽ co giãn và có thanh cuộn */}
        <div
          className="body min-h-screen flex-grow-1 px-3"
          style={{ overflowY: "auto" }}
        >
          {children}
        </div>

        <AdminFooter />
      </div>
    </div>
  );
}
