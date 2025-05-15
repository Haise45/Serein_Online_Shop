"use client";
import { logoutUserApi } from "@/services/authService";
import { AppDispatch, RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import Link from "next/link";
import { Fragment } from "react";
import {
  FiFileText,
  FiLogIn,
  FiLogOut,
  FiSettings,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";

export default function UserMenu() {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = async () => {
    try {
      await logoutUserApi();
    } catch (error) {
      console.error("Lỗi khi gọi API logout backend:", error);
    }
    dispatch(logout());
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="rounded-full p-2 text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none">
          <span className="sr-only">Mở menu người dùng</span>
          <FiUser className="h-6 w-6" aria-hidden="true" />
        </MenuButton>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg focus:outline-none">
          {isAuthenticated && user ? (
            <>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-900">Chào, {user.name}!</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <MenuItem as={Fragment}>
                <Link
                  href="/profile"
                  className="ui-active:bg-gray-100 flex w-full items-center px-4 py-2 text-left text-sm text-gray-700"
                >
                  <FiSettings className="mr-2 h-4 w-4" /> Thông tin cá nhân
                </Link>
              </MenuItem>
              <MenuItem as={Fragment}>
                <Link
                  href="/profile/orders"
                  className="ui-active:bg-gray-100 flex w-full items-center px-4 py-2 text-left text-sm text-gray-700"
                >
                  <FiFileText className="mr-2 h-4 w-4" /> Đơn hàng của tôi
                </Link>
              </MenuItem>
              <MenuItem>
                <button
                  onClick={handleLogout}
                  className="ui-active:bg-gray-100 flex w-full items-center px-4 py-2 text-left text-sm text-gray-700"
                >
                  <FiLogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </button>
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem as={Fragment}>
                <Link
                  href="/login"
                  className="ui-active:bg-gray-100 flex w-full items-center px-4 py-2 text-left text-sm text-gray-700"
                >
                  <FiLogIn className="mr-2 h-4 w-4" /> Đăng nhập
                </Link>
              </MenuItem>
              <MenuItem as={Fragment}>
                <Link
                  href="/register"
                  className="ui-active:bg-gray-100 flex w-full items-center px-4 py-2 text-left text-sm text-gray-700"
                >
                  <FiUserPlus className="mr-2 h-4 w-4" /> Đăng ký
                </Link>
              </MenuItem>
            </>
          )}
        </MenuItems>
      </Transition>
    </Menu>
  );
}
