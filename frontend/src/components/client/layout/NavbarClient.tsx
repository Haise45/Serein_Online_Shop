// NavbarClient.tsx
"use client";

import { buildCategoryTree } from "@/lib/utils";
import { getAllCategories } from "@/services/categoryService";
import { Category } from "@/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FiHeart, FiMenu, FiSearch, FiShoppingCart } from "react-icons/fi";

import { useGetCart } from "@/lib/react-query/cartQueries";
import { useGetWishlist } from "@/lib/react-query/wishlistQueries";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CartPreviewModal from "../cart/CartPreviewModal";
import CategoryMenu from "../category/CategoryMenu"; // CategoryMenu đã được cập nhật cho Mega Menu
import SideDrawer from "./SideDrawer";
import UserMenu from "./UserMenu"; // Import UserMenu

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
  const [isMegaMenuOverlayVisible, setIsMegaMenuOverlayVisible] =
    useState(false);

  const { data: cartData } = useGetCart();
  const cartItemCount = cartData?.totalQuantity || 0;

  const { data: wishlistItemsData } = useGetWishlist();
  const wishlistCount = wishlistItemsData?.length || 0;

  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setErrorCategories(null);
      try {
        const data = await getAllCategories({ isActive: true });
        const activeCategories =
          data?.filter((c: Category) => c.isActive) || [];
        const categoryTree = buildCategoryTree(activeCategories);
        setCategories(categoryTree);
      } catch (error) {
        console.error("Lỗi fetch danh mục cho Navbar:", error);
        setErrorCategories("Không thể tải danh mục"); // Hiển thị lỗi thân thiện hơn
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

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

  const handleShowOverlay = useCallback(() => {
    setIsMegaMenuOverlayVisible(true);
  }, []);

  const handleHideOverlay = useCallback(() => {
    setIsMegaMenuOverlayVisible(false);
  }, []);

  // Màu chữ và icon cho navbar nền sáng
  const navTextColor = "text-gray-700";
  const navIconColor = "text-gray-500";
  const navHoverBgColor = "hover:bg-gray-100";
  const navHoverTextColor = "hover:text-gray-900";

  return (
    <>
      {/* Lớp Overlay cho Mega Menu */}
      {isMegaMenuOverlayVisible && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={handleHideOverlay} // Click vào overlay cũng ẩn nó và menu
        />
      )}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Left Section: Hamburger (Mobile) & Logo */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className={`rounded-md p-1.5 ${navIconColor} ${navHoverBgColor} ${navHoverTextColor} mr-2 focus:ring-2 focus:ring-gray-500 focus:outline-none focus:ring-inset md:hidden`}
                aria-controls="mobile-menu"
                aria-expanded={isDrawerOpen ? "true" : "false"}
              >
                <span className="sr-only">Mở menu chính</span>
                <FiMenu className="h-6 w-6" />
              </button>
              <Link href="/">
                <span
                  className={`text-2xl font-bold italic sm:text-3xl ${navTextColor}`}
                >
                  SEREIN
                </span>
              </Link>
            </div>
            {/* Middle Section: Navlinks (Desktop) */}
            <div
              className={`relative hidden flex-grow items-center justify-center md:flex ${navTextColor}`}
            >
              {loadingCategories ? (
                <div className="flex space-x-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-5 w-20 animate-pulse rounded bg-gray-300" // Màu skeleton phù hợp hơn
                    ></div>
                  ))}
                </div>
              ) : errorCategories ? (
                <span className="text-sm text-red-500">{errorCategories}</span>
              ) : (
                // CategoryMenu giờ sẽ nhận màu chữ từ div cha hoặc tự set màu cho link cấp 0
                <CategoryMenu
                  categories={categories}
                  isMobile={false}
                  className="items-center"
                  onShowOverlay={handleShowOverlay}
                  onHideOverlay={handleHideOverlay}
                />
              )}
            </div>
            {/* Right Section: Icons */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {" "}
              {/* Giảm space-x một chút nếu cần */}
              {/* Search Icon & Form */}
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`rounded-full p-2 ${navIconColor} ${navHoverBgColor} ${navHoverTextColor} focus:outline-none`}
                  title="Tìm kiếm"
                >
                  <FiSearch className="h-5 w-5 md:h-6 md:w-6" />{" "}
                  {/* Kích thước icon có thể nhỏ hơn một chút */}
                </button>
                {isSearchOpen && (
                  <form
                    onSubmit={handleSearchSubmit}
                    // Nền search bar có thể là màu sáng hơn hoặc xám nhạt
                    className="ring-opacity-5 absolute top-full right-0 z-20 mt-2 w-64 rounded-md bg-white p-2 shadow-lg ring-1 ring-black sm:w-80"
                  >
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm sản phẩm..."
                      // Màu text input và placeholder
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                      autoFocus
                    />
                  </form>
                )}
              </div>
              <Link
                href="/wishlist"
                className={`relative rounded-full p-2 ${navIconColor} ${navHoverBgColor} ${navHoverTextColor}`}
                title="Danh sách yêu thích"
              >
                <FiHeart className="h-5 w-5 md:h-6 md:w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex translate-x-1/3 -translate-y-1/5 transform items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-red-100">
                    {" "}
                    {/* Điều chỉnh padding cho badge */}
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                className={`relative rounded-full p-2 ${navIconColor} ${navHoverBgColor} ${navHoverTextColor}`}
                title="Giỏ hàng"
                onClick={() => setIsCartModalOpen(true)}
              >
                <FiShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex translate-x-1/3 -translate-y-1/5 transform items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-red-100">
                    {cartItemCount}
                  </span>
                )}
              </button>
              {/* UserMenu sẽ tự xử lý màu sắc bên trong nó dựa trên MenuItems props */}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>
      {/* Side Drawer và CartPreviewModal không thay đổi */}
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
