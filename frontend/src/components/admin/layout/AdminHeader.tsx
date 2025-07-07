"use client";
import "@/app/globals.css";
import SettingsSwitcher from "@/components/shared/SettingsSwitcher";
import { logoutUserApi } from "@/services/authService";
import { AppDispatch, RootState } from "@/store";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { cilAccountLogout, cilMenu } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CContainer,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavItem,
  CNavLink,
} from "@coreui/react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import NotificationBell from "./NotificationBell";

interface AdminHeaderProps {
  onSidebarToggle: () => void;
  onUnfoldableToggle: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  onSidebarToggle,
  onUnfoldableToggle,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUserApi();
    } catch (e) {
      console.error(e);
    }
    dispatch(logoutAction());
    queryClient.clear();
    toast.success("Đăng xuất thành công!");
    window.location.replace("/login");
  }, [dispatch, queryClient]);

  return (
    <CHeader
      position="sticky"
      className="mb-4 border-b border-gray-200 bg-white shadow-sm"
    >
      <CContainer fluid className="px-4">
        <CHeaderToggler
          onClick={onUnfoldableToggle}
          className="d-none d-lg-block border-0 px-2"
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderToggler
          onClick={onSidebarToggle}
          className="d-lg-none border-0 px-2"
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        <CHeaderNav className="ms-auto">
          {/* Thay thế toàn bộ code thông báo bằng component mới */}
          <SettingsSwitcher />
          <NotificationBell />
        </CHeaderNav>

        <CHeaderNav>
          <li className="nav-item d-none d-md-block py-1">
            <div className="vr text-body-secondary text-opacity-75 mx-2 h-100"></div>
          </li>
          {user && (
            <CNavItem className="d-flex align-items-center px-2">
              <span className="fw-semibold text-sm text-gray-700">
                {user.name}
              </span>
            </CNavItem>
          )}
          <CNavItem>
            <CNavLink
              href="#"
              onClick={handleLogout}
              className="px-2 text-gray-600 hover:text-indigo-600"
            >
              <CIcon icon={cilAccountLogout} size="lg" title="Đăng xuất" />
            </CNavLink>
          </CNavItem>
        </CHeaderNav>
      </CContainer>
    </CHeader>
  );
};

export default AdminHeader;
