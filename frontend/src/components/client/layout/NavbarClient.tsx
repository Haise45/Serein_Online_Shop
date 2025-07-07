"use client";

import SearchSuggestionList from "@/components/shared/SearchSuggestionList";
import useDebounce from "@/hooks/useDebounce";
import { useGetAttributes } from "@/lib/react-query/attributeQueries";
import { useGetCart } from "@/lib/react-query/cartQueries";
import { useGetAllCategories } from "@/lib/react-query/categoryQueries";
import { useGetProducts } from "@/lib/react-query/productQueries";
import { useGetWishlist } from "@/lib/react-query/wishlistQueries";
import { buildCategoryTree } from "@/lib/utils";
import { GetProductsParams } from "@/services/productService";
import { Category } from "@/types";
import { Transition } from "@headlessui/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiHeart, FiMenu, FiSearch, FiShoppingCart, FiX } from "react-icons/fi";
import CartPreviewModal from "../cart/CartPreviewModal";
import CategoryMenu from "../category/CategoryMenu";
import SideDrawer from "./SideDrawer";
import UserMenu from "./UserMenu";
import SettingsSwitcher from "@/components/shared/SettingsSwitcher";

export default function NavbarClient() {
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchBarActive, setIsSearchBarActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<
    (Category & { children?: Category[] })[]
  >([]);
  const [isMegaMenuOverlayVisible, setIsMegaMenuOverlayVisible] =
    useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const t = useTranslations("NavbarClient");

  const {
    data: categoriesData,
    isLoading: loadingCategories,
    isError: errorCategories,
  } = useGetAllCategories({
    limit: 200, // Lấy một số lượng lớn để đảm bảo có đủ cho menu
    isActive: true,
  });

  // Xử lý dữ liệu từ React Query
  useEffect(() => {
    if (categoriesData) {
      // Dữ liệu trả về là object có phân trang
      const activeCategories = categoriesData.categories || [];
      const categoryTree = buildCategoryTree(activeCategories);
      setCategories(categoryTree);
    }
  }, [categoriesData]);

  const { data: cartData } = useGetCart();
  const cartItemCount = cartData?.totalDistinctItems || 0;

  const { data: wishlistItemsData } = useGetWishlist();
  const wishlistCount = wishlistItemsData?.length || 0;

  const router = useRouter();
  const pathname = usePathname();
  const searchParamsHook = useSearchParams();

  // --- Logic cho Search Suggestions ---
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce 300ms
  const searchSuggestionParams: GetProductsParams = useMemo(
    () => ({
      search: debouncedSearchTerm,
      limit: 8, // Số lượng gợi ý
      // select: 'name,slug,images,price,salePrice,displayPrice,isOnSale', // Nếu API hỗ trợ select fields
    }),
    [debouncedSearchTerm],
  );

  const {
    data: suggestedProductsData,
    isLoading: isLoadingSuggestions,
    isFetching: isFetchingSuggestions, // Dùng để biết khi nào query đang fetch lại
    isPlaceholderData,
  } = useGetProducts(searchSuggestionParams, {
    enabled:
      !!debouncedSearchTerm &&
      debouncedSearchTerm.length > 1 &&
      isSearchBarActive, // Chỉ fetch khi search bar active và có từ khóa
    placeholderData: (previousData) => previousData,
  });
  const suggestedProducts = suggestedProductsData?.products || [];
  // --- Kết thúc Logic Search Suggestions ---

  const { data: attributes } = useGetAttributes();
  const attributeMap = useMemo(() => {
    if (!attributes) return new Map();
    const map = new Map<
      string,
      { label: string; values: Map<string, string> }
    >();
    attributes.forEach((attr) => {
      const valueMap = new Map<string, string>();
      attr.values.forEach((val) => valueMap.set(val._id, val.value));
      map.set(attr._id, { label: attr.label, values: valueMap });
    });
    return map;
  }, [attributes]);

  useEffect(() => {
    setIsSearchBarActive(false);
    setSearchTerm("");
  }, [pathname, searchParamsHook]);

  const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsSearchBarActive(false);
    }
  };

  const toggleSearchBar = () => {
    const newIsActive = !isSearchBarActive;
    setIsSearchBarActive(newIsActive);
    if (newIsActive) {
      // Focus vào input khi search bar mở
      // Dùng setTimeout để đảm bảo input đã render
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
      setSearchTerm(""); // Xóa searchTerm khi đóng
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
      {(isMegaMenuOverlayVisible ||
        (isSearchBarActive &&
          searchTerm.length > 0 &&
          suggestedProducts.length > 0)) && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={() => {
            handleHideOverlay();
            // Không đóng search bar khi click overlay, chỉ khi click nút X hoặc submit
          }}
        />
      )}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-5">
            {/* Left Section: Hamburger (Mobile) & Logo */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className={`rounded-md p-1.5 ${navIconColor} ${navHoverBgColor} ${navHoverTextColor} focus:outline-none md:hidden`}
                aria-controls="mobile-menu-drawer"
                aria-expanded={isDrawerOpen}
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
            <div className="flex items-center space-x-1 md:space-x-2">
              {/* Search Icon & Form */}
              <div className="relative">
                <button
                  onClick={toggleSearchBar} // Click icon sẽ mở/đóng thanh search lớn
                  className={`rounded-full p-2 ${navIconColor} ${navHoverBgColor} ${navHoverTextColor} focus:outline-none`}
                  title="Tìm kiếm"
                >
                  {isSearchBarActive ? (
                    <FiX className="h-5 w-5 md:h-6 md:w-6" />
                  ) : (
                    <FiSearch className="h-5 w-5 md:h-6 md:w-6" />
                  )}
                </button>
              </div>
              <Link
                href="/wishlist"
                className={`relative rounded-full p-2 ${navIconColor} ${navHoverBgColor} ${navHoverTextColor}`}
                title={t("wishlist")}
              >
                <FiHeart className="h-5 w-5 md:h-6 md:w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex translate-x-1/4 -translate-y-1/5 transform items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-red-100">
                    {/* Điều chỉnh padding cho badge */}
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                className={`relative rounded-full p-2 ${navIconColor} ${navHoverBgColor} ${navHoverTextColor}`}
                title={t("cart")}
                onClick={() => setIsCartModalOpen(true)}
              >
                <FiShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex translate-x-1/4 -translate-y-1/5 transform items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-red-100">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <div className="hidden items-center md:flex">
                <SettingsSwitcher />
              </div>

              {/* Thêm một đường kẻ dọc để phân tách */}
              <div className="mx-2 hidden h-6 w-px bg-gray-200 md:block"></div>
              <UserMenu />
            </div>
          </div>
        </div>
        {/* Thanh Tìm kiếm Lớn và Gợi ý */}
        <Transition
          show={isSearchBarActive}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 -translate-y-4"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 -translate-y-4"
        >
          <div className="absolute top-full right-0 left-0 z-20 border-t border-gray-200 bg-white shadow-lg">
            <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
                  disabled={!searchTerm.trim()}
                  aria-label={t("search")}
                >
                  <FiSearch className="h-5 w-5" />
                </button>
              </form>

              {/* Gợi ý tìm kiếm */}
              <div className="mt-3 max-h-[calc(100vh-250px)] overflow-y-auto rounded-md bg-white">
                <SearchSuggestionList
                  suggestions={suggestedProducts}
                  isLoading={
                    isLoadingSuggestions ||
                    (isFetchingSuggestions && !isPlaceholderData)
                  }
                  searchTerm={debouncedSearchTerm}
                  onSuggestionClick={() => setIsSearchBarActive(false)}
                  onViewAllClick={handleSearchSubmit}
                />
              </div>
            </div>
          </div>
        </Transition>
      </header>
      <SideDrawer
        isOpen={isDrawerOpen}
        setIsOpen={setIsDrawerOpen}
        categories={categories}
      />
      <CartPreviewModal
        isOpen={isCartModalOpen}
        setIsOpen={setIsCartModalOpen}
        attributeMap={attributeMap}
      />
    </>
  );
}
