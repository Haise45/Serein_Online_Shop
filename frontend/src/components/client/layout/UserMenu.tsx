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
import {
  useSearchParams as useNextSearchParamsHook,
  usePathname,
} from "next/navigation";
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

  // Lấy thông tin URL hiện tại
  const pathname = usePathname();
  const searchParams = useNextSearchParamsHook();

  const handleLogout = async () => {
    try {
      await logoutUserApi();
    } catch (error) {
      console.error("Lỗi khi gọi API logout backend:", error);
    }
    dispatch(logout());
  };

  // Tạo redirectUrl từ pathname và searchParams hiện tại
  const currentQueryString = searchParams.toString();
  const redirectUrl =
    pathname + (currentQueryString ? `?${currentQueryString}` : "");

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <span className="sr-only">Mở menu người dùng</span>
          <FiUser className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
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
        <MenuItems className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10 focus:outline-none">
          {isAuthenticated && user ? (
            // ... (Phần menu cho người dùng đã đăng nhập giữ nguyên)
            <>
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  Chào, {user.name}!
                </p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <MenuItem as={Fragment}>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                >
                  <FiSettings className="mr-2 inline-block h-4 w-4" /> Thông tin
                  cá nhân
                </Link>
              </MenuItem>
              <MenuItem as={Fragment}>
                <Link
                  href="/profile/orders"
                  className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                >
                  <FiFileText className="mr-2 inline-block h-4 w-4" /> Đơn hàng
                  của tôi
                </Link>
              </MenuItem>
              <MenuItem>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                >
                  <FiLogOut className="mr-2 inline-block h-4 w-4" /> Đăng xuất
                </button>
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem as={Fragment}>
                <Link
                  // Thêm redirect query parameter
                  href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
                  className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                >
                  <FiLogIn className="mr-2 inline-block h-4 w-4" /> Đăng nhập
                </Link>
              </MenuItem>
              <MenuItem as={Fragment}>
                <Link
                  // Thêm redirect query parameter cho trang đăng ký luôn
                  href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
                  className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                >
                  <FiUserPlus className="mr-2 inline-block h-4 w-4" /> Đăng ký
                </Link>
              </MenuItem>
            </>
          )}
        </MenuItems>
      </Transition>
    </Menu>
  );
}
