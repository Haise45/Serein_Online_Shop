"use client";

import { buildCategoryTree } from "@/lib/utils";
import { getAllCategories } from "@/services/categoryService";
import { RootState } from "@/store";
import { Category } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiHeart, FiMenu, FiSearch, FiShoppingCart } from "react-icons/fi";
import { useSelector } from "react-redux";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CategoryMenu from "./CategoryMenu";
import SideDrawer from "./SideDrawer";
import UserMenu from "./UserMenu";

export default function NavbarClient() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<
    (Category & { children?: Category[] })[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);

  // Lấy số lượng item trong giỏ hàng (ví dụ từ Redux hoặc API)
  // Tạm thời để 0, bạn cần tích hợp với state cart thực tế
  const cartItemCount = useSelector(
    (state: RootState) => state.cart?.totalQuantity || 0,
  ); // Giả sử có cartSlice

  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams(); // Hook để lấy query params

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setErrorCategories(null);
      try {
        const data = await getAllCategories({ isActive: true }); // Chỉ lấy category active
        const activeCategories =
          data?.filter((c: Category) => c.isActive) || []; // Đảm bảo data là mảng
        const categoryTree = buildCategoryTree(activeCategories);
        setCategories(categoryTree);
      } catch (error) {
        console.error("Lỗi fetch danh mục cho Navbar:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Đóng search bar khi chuyển route
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchTerm("");
  }, [pathname, searchParamsHook]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <>
      <header className="shadow-m sticky top-0 z-30 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex py-6 items-center justify-between">
            {/* Left Section: Hamburger (Mobile) & Logo */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-none focus:ring-inset md:hidden"
                aria-controls="mobile-menu"
                aria-expanded={isDrawerOpen ? "true" : "false"}
              >
                <span className="sr-only">Mở menu chính</span>
                <FiMenu className="h-6 w-6" />
              </button>
              <Link href="/">
                <span className="text-3xl font-bold italic">SEREIN</span>{" "}
                {/* Hoặc logo image */}
              </Link>
            </div>

            {/* Middle Section: Navlinks (Desktop) */}
            <div className="hidden items-center md:ml-6 md:flex">
              {" "}
              {/* Thêm items-center */}
              {loadingCategories ? (
                <div className="flex space-x-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-5 w-20 animate-pulse rounded bg-gray-700"
                    ></div>
                  ))}
                </div>
              ) : errorCategories ? (
                <span className="text-sm text-red-400">{errorCategories}</span>
              ) : (
                <CategoryMenu categories={categories} />
              )}
              {/* Thêm các link tĩnh khác nếu cần
              <Link
                href="/sale-off"
                className="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                SALE OFF
              </Link>
              <Link
                href="/tin-tuc"
                className="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                TIN TỨC MLB
              </Link> */}
            </div>

            {/* Right Section: Icons */}
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Search Icon & Form */}
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="rounded-full p-2 text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none"
                  title="Tìm kiếm"
                >
                  <FiSearch className="h-6 w-6" />
                </button>
                {isSearchOpen && (
                  <form
                    onSubmit={handleSearchSubmit}
                    className="absolute top-full right-0 z-20 mt-2 w-64 rounded-md bg-gray-800 p-2 shadow-lg sm:w-80"
                  >
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm sản phẩm..."
                      className="w-full rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      autoFocus
                    />
                  </form>
                )}
              </div>

              <Link
                href="/wishlist"
                className="rounded-full p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
                title="Danh sách yêu thích"
              >
                <FiHeart className="h-6 w-6" />
                {/* Badge số lượng wishlist (nếu có) */}
              </Link>

              <Link
                href="/cart"
                className="relative rounded-full p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
                title="Giỏ hàng"
              >
                <FiShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs leading-none font-bold text-red-100">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              <UserMenu />
            </div>
          </div>
        </div>
      </header>
      {/* Side Drawer cho Mobile */}
      <SideDrawer
        isOpen={isDrawerOpen}
        setIsOpen={setIsDrawerOpen}
        categories={categories}
      />
    </>
  );
}
