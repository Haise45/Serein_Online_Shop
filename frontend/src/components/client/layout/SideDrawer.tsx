"use client";
import { logoutUserApi } from "@/services/authService";
import { AppDispatch, RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { Category } from "@/types";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import Link from "next/link";
import { Fragment } from "react";
import { FiHome, FiLogIn, FiUserPlus, FiX } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import CategoryMenu from "../category/CategoryMenu";

interface SideDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  categories: (Category & { children?: Category[] })[];
}

export default function SideDrawer({
  isOpen,
  setIsOpen,
  categories,
}: SideDrawerProps) {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const dispatch = useDispatch<AppDispatch>();

  const closeDrawer = () => setIsOpen(false);

  const handleLogoutMobile = async () => {
    closeDrawer();
    try {
      await logoutUserApi();
    } catch (error) {
      console.error("Lỗi logout backend (mobile):", error);
    }
    dispatch(logout());
  };

  return (
    // Thay thế Transition.Root bằng Transition, thêm `appear` cho animation lần đầu
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        id="mobile-menu"
        className="relative z-40 md:hidden"
        onClose={setIsOpen}
      >
        {/* Sử dụng DialogBackdrop thay vì div tự tạo */}
        <TransitionChild
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-gray-600/75" />
        </TransitionChild>

        {/* Panel */}
        <div className="fixed inset-0 z-40 flex">
          {/* Thay thế Transition.Child bằng TransitionChild */}
          <TransitionChild
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            {/* Thay thế Dialog.Panel bằng DialogPanel */}
            <DialogPanel className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-xl">
              <div className="flex px-4 pt-5 pb-2">
                <button
                  type="button"
                  className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="sr-only">Đóng menu</span>
                  <FiX className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Links */}
              <div className="mt-2 space-y-6 border-t border-gray-200 px-4 py-6">
                <div className="flow-root">
                  <Link
                    href="/"
                    className="-m-2 block p-2 font-medium text-gray-900"
                    onClick={closeDrawer}
                  >
                    <FiHome className="mr-2 inline h-5 w-5" /> Trang chủ
                  </Link>
                </div>
                {/* Danh mục sản phẩm */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="mb-2 text-base font-semibold text-gray-900">
                    Danh mục sản phẩm
                  </h3>
                  <CategoryMenu
                    categories={categories}
                    isMobile={true}
                    onLinkClick={closeDrawer}
                  />
                </div>
              </div>

              {/* Auth Links */}
              <div className="space-y-6 border-t border-gray-200 px-4 py-6">
                {isAuthenticated && user ? (
                  <>
                    <div className="flow-root">
                      <Link
                        href="/profile"
                        className="-m-2 block p-2 font-medium text-gray-900"
                        onClick={closeDrawer}
                      >
                        Thông tin cá nhân ({user.name})
                      </Link>
                    </div>
                    <div className="flow-root">
                      <Link
                        href="/profile/orders"
                        className="-m-2 block p-2 font-medium text-gray-900"
                        onClick={closeDrawer}
                      >
                        Đơn hàng của tôi
                      </Link>
                    </div>
                    <div className="flow-root">
                      <button
                        onClick={handleLogoutMobile}
                        className="-m-2 block w-full p-2 text-left font-medium text-gray-900"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flow-root">
                      <Link
                        href="/login"
                        className="-m-2 block p-2 font-medium text-gray-900"
                        onClick={closeDrawer}
                      >
                        <FiLogIn className="mr-2 inline h-5 w-5" /> Đăng nhập
                      </Link>
                    </div>
                    <div className="flow-root">
                      <Link
                        href="/register"
                        className="-m-2 block p-2 font-medium text-gray-900"
                        onClick={closeDrawer}
                      >
                        <FiUserPlus className="mr-2 inline h-5 w-5" /> Đăng ký
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
