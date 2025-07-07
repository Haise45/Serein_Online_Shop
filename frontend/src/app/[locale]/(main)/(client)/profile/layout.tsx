"use client";

import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { logoutUserApi } from "@/services/authService";
import { AppDispatch, RootState } from "@/store";
import { logout as logoutAction } from "@/store/slices/authSlice";
import { BreadcrumbItem } from "@/types";
import { generateProfileBreadcrumbs, ProfileBreadcrumbsTranslator } from "@/utils/profileBreadcrumbs";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, ReactNode, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiArchive,
  FiChevronRight,
  FiLoader,
  FiLogOut,
  FiMapPin,
  FiMenu,
  FiTag,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";

interface ProfileLayoutProps {
  children: ReactNode;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const truncateEmailMiddle = (
  email: string | undefined | null,
  fallbackText: string,
  localPartLength: number = 8,
): string => {
  if (!email) return fallbackText;
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [localPart, domainPart] = parts;
  if (localPart.length > localPartLength) {
    return `${localPart.substring(0, localPartLength)}...@${domainPart}`;
  }
  return email;
};

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  // --- Khởi tạo các Hooks ---
  const t = useTranslations("ProfileLayout");
  const tBreadcrumbs = useTranslations("ProfileBreadcrumbs");
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const {
    user,
    isAuthenticated,
    isLoading: authIsLoading,
  } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);

  // --- Cấu hình cho Sidebar Navigation ---
  // Sử dụng hàm `t` để dịch các `name` và `description`
  const navigation = [
    {
      name: t("navigation.profile.name"),
      href: "/profile",
      icon: FiUser,
      description: t("navigation.profile.description"),
      currentMatcher: (pathname: string) => pathname === "/profile",
    },
    {
      name: t("navigation.addresses.name"),
      href: "/profile/addresses",
      icon: FiMapPin,
      description: t("navigation.addresses.description"),
      currentMatcher: (pathname: string) =>
        pathname.startsWith("/profile/addresses"),
    },
    {
      name: t("navigation.orders.name"),
      href: "/profile/orders",
      icon: FiArchive,
      description: t("navigation.orders.description"),
      currentMatcher: (pathname: string) =>
        pathname.startsWith("/profile/orders"),
    },
    {
      name: t("navigation.vouchers.name"),
      href: "/profile/vouchers",
      icon: FiTag,
      description: t("navigation.vouchers.description"),
      currentMatcher: (pathname: string) =>
        pathname.startsWith("/profile/vouchers"),
    },
  ];

  // --- useEffect để xử lý Logic phức tạp ---
  useEffect(() => {
    // 1. Bảo vệ Route: Nếu chưa load xong auth mà đã không đăng nhập, chuyển hướng về trang login
    if (!authIsLoading && !isAuthenticated) {
      const currentRedirectUrl = pathname + window.location.search;
      router.replace(
        `/login?redirect=${encodeURIComponent(currentRedirectUrl)}`,
      );
    }

    // 2. Tạo Breadcrumbs động: Chỉ tạo khi đã đăng nhập và có pathname
    if (pathname && isAuthenticated) {
      const dynamicData: { orderId?: string } = {};
      if (pathname.startsWith("/profile/orders/")) {
        const segments = pathname.split("/");
        if (segments.length === 4 && segments[3]) {
          dynamicData.orderId = segments[3];
        }
      }
      // Gọi hàm tiện ích và truyền vào hàm `tBreadcrumbs` đã được khởi tạo
      setBreadcrumbItems(
        generateProfileBreadcrumbs(
          pathname,
          dynamicData,
          tBreadcrumbs as ProfileBreadcrumbsTranslator,
        ),
      );
    }
  }, [isAuthenticated, authIsLoading, pathname, router, tBreadcrumbs]);

  // --- Xử lý sự kiện Logout ---
  const handleLogout = async () => {
    try {
      await logoutUserApi();
    } catch (error: unknown) {
      toast.error(t("logoutError", { error: (error as Error).message }));
    }
    dispatch(logoutAction());
    queryClient.clear();
    toast.success(t("logoutSuccess"));
    router.push("/");
    setSidebarOpen(false);
  };

  // Nếu đang kiểm tra auth hoặc chưa xác thực, hiển thị màn hình loading
  // Logic trong useEffect sẽ xử lý việc chuyển hướng.
  if (authIsLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <FiLoader className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-sm text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Component con tái sử dụng cho cả desktop và mobile sidebar
  const SidebarContent = () => (
    <div className="flex h-full grow flex-col overflow-y-auto bg-white shadow-xl lg:shadow-none">
      <div className="flex justify-center bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-8">
        <div className="flex w-full max-w-full items-center space-x-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <FiUser className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-white">
              {user?.name || t("myAccount")}
            </h2>
            <p className="truncate text-sm text-indigo-100">
              {truncateEmailMiddle(user?.email, t("manageAccount"))}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul role="list" className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={classNames(
                  item.currentMatcher(pathname)
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-transparent text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
                  "group flex items-center justify-between rounded-xl border p-4 text-sm font-medium transition-all duration-200 hover:shadow-sm",
                )}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={classNames(
                      item.currentMatcher(pathname)
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600",
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200",
                    )}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="hidden text-xs text-gray-500 lg:block">
                      {item.description}
                    </div>
                  </div>
                </div>
                <FiChevronRight
                  className={classNames(
                    item.currentMatcher(pathname)
                      ? "text-indigo-400"
                      : "text-gray-300",
                    "h-4 w-4 transition-colors duration-200",
                  )}
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center justify-between rounded-xl p-4 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors duration-200 group-hover:bg-red-100">
              <FiLogOut className="h-5 w-5 text-gray-500 group-hover:text-red-600" />
            </div>
            <span>{t("navigation.logout")}</span>
          </div>
          <FiChevronRight className="h-4 w-4 text-gray-300 group-hover:text-red-400" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-0 lg:px-10">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6 sm:mt-8 lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Mobile sidebar toggle */}
          <div className="mb-6 lg:hidden">
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu className="mr-2 h-5 w-5" aria-hidden="true" />
              {t("accountMenu")}
            </button>
          </div>

          {/* Mobile sidebar (Off-canvas) */}
          <Transition show={sidebarOpen} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-50 lg:hidden"
              onClose={setSidebarOpen}
            >
              {/* Backdrop */}
              <Transition
                as={Fragment}
                show={sidebarOpen}
                enter="transition-opacity ease-linear duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity ease-linear duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
              </Transition>

              <div className="fixed inset-0 flex">
                <Transition
                  as={Fragment}
                  show={sidebarOpen}
                  enter="transition ease-in-out duration-300 transform"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transition ease-in-out duration-300 transform"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
                >
                  <DialogPanel className="relative mr-16 flex w-full max-w-sm flex-1">
                    {/* Close button */}
                    <Transition
                      as={Fragment}
                      show={sidebarOpen}
                      enter="ease-in-out duration-300"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                      leave="ease-in-out duration-300"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <div className="absolute top-0 -right-12 flex w-12 justify-center pt-5">
                        <button
                          type="button"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span className="sr-only">{t("closeMenu")}</span>
                          <FiX
                            className="h-6 w-6 text-white"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </Transition>
                    <SidebarContent />
                  </DialogPanel>
                </Transition>
              </div>
            </Dialog>
          </Transition>

          {/* Desktop Sidebar */}
          <div className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-23 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
              <SidebarContent />
            </div>
          </div>

          {/* Main content area */}
          <main className="lg:col-span-9">
            <div className="rounded-2xl bg-white py-6 px-4 shadow-sm ring-1 ring-gray-200 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
