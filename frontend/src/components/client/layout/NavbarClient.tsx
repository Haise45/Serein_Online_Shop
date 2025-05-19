"use client";

import { buildCategoryTree } from "@/lib/utils";
import { getAllCategories } from "@/services/categoryService";
import { Category } from "@/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiHeart, FiMenu, FiSearch, FiShoppingCart } from "react-icons/fi";

import { useGetCart } from "@/lib/react-query/cartQueries";
import { useGetWishlist } from "@/lib/react-query/wishlistQueries";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CartPreviewModal from "../cart/CartPreviewModal";
import CategoryMenu from "../category/CategoryMenu";
import SideDrawer from "./SideDrawer";
import UserMenu from "./UserMenu";

export default function NavbarClient() {
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
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
  const { data: cartData } = useGetCart();
  const cartItemCount = cartData?.totalQuantity || 0;

  const { data: wishlistItemsData } = useGetWishlist(); // Lấy dữ liệu wishlist
  const wishlistCount = wishlistItemsData?.length || 0;

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
          <div className="flex items-center justify-between py-6">
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
                <span className="text-2xl font-bold italic sm:text-3xl">
                  SEREIN
                </span>{" "}
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
            <div className="flex items-center space-x-1 md:space-x-4">
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
                      className="w-full rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                      autoFocus
                    />
                  </form>
                )}
              </div>

              <Link
                href="/wishlist"
                className="relative rounded-full p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
                title="Danh sách yêu thích"
              >
                <FiHeart className="h-6 w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex translate-x-1/3 -translate-y-1/5 transform items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs leading-none font-bold text-red-100">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <button
                className="relative rounded-full p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
                title="Giỏ hàng"
                onClick={() => setIsCartModalOpen(true)}
              >
                <FiShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex translate-x-1/3 -translate-y-1/5 transform items-center justify-center rounded-full bg-red-600 px-2 py-1 text-xs leading-none font-bold text-red-100">
                    {cartItemCount}
                  </span>
                )}
              </button>

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
      <CartPreviewModal
        isOpen={isCartModalOpen}
        setIsOpen={setIsCartModalOpen}
      />
    </>
  );
}
