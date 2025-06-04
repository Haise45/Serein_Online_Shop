"use client";

import useDebounce from "@/hooks/useDebounce";
import { useGetCart } from "@/lib/react-query/cartQueries";
import { useGetProducts } from "@/lib/react-query/productQueries"; // Import useGetProducts
import { useGetWishlist } from "@/lib/react-query/wishlistQueries";
import { buildCategoryTree, formatCurrency } from "@/lib/utils";
import { getAllCategories } from "@/services/categoryService";
import { GetProductsParams } from "@/services/productService";
import { Category } from "@/types"; // Import Product
import { Transition } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"; // Thêm useRef
import {
  FiHeart,
  FiLoader,
  FiMenu,
  FiSearch,
  FiShoppingCart,
  FiX,
} from "react-icons/fi"; // Thêm FiX, FiLoader
import CartPreviewModal from "../cart/CartPreviewModal";
import CategoryMenu from "../category/CategoryMenu";
import SideDrawer from "./SideDrawer";
import UserMenu from "./UserMenu";

export default function NavbarClient() {
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchBarActive, setIsSearchBarActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<
    (Category & { children?: Category[] })[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);
  const [isMegaMenuOverlayVisible, setIsMegaMenuOverlayVisible] =
    useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: cartData } = useGetCart();
  const cartItemCount = cartData?.totalQuantity || 0;

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
            <div className="flex items-center space-x-1 md:space-x-3">
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
                title="Danh sách yêu thích"
              >
                <FiHeart className="h-5 w-5 md:h-6 md:w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex translate-x-1/3 -translate-y-1/5 transform items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-red-100">
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
          <div className="absolute top-full right-0 left-0 z-30 border-t border-gray-200 bg-white shadow-lg">
            <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Bạn muốn tìm gì hôm nay?"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-indigo-600 hover:text-indigo-700 disabled:text-gray-400"
                  disabled={!searchTerm.trim()}
                  aria-label="Tìm kiếm"
                >
                  <FiSearch className="h-5 w-5" />
                </button>
              </form>

              {/* Gợi ý tìm kiếm */}
              {debouncedSearchTerm.length > 1 && (
                <div className="mt-3 max-h-[calc(100vh-250px)] overflow-y-auto rounded-md bg-white">
                  {isLoadingSuggestions &&
                    !isPlaceholderData && ( // Chỉ hiện loading "to" khi không có placeholder
                      <div className="p-4 text-center text-sm text-gray-500">
                        <FiLoader className="mr-2 inline animate-spin" /> Đang
                        tìm...
                      </div>
                    )}
                  {isFetchingSuggestions &&
                    isPlaceholderData && ( // Có thể hiện một loader nhỏ hơn khi có placeholder
                      <div className="p-2 text-center text-xs text-gray-400">
                        <FiLoader className="mr-1 inline h-3 w-3 animate-spin" />
                      </div>
                    )}

                  {!isFetchingSuggestions &&
                    !isLoadingSuggestions &&
                    debouncedSearchTerm.length > 1 &&
                    suggestedProducts.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Không tìm thấy sản phẩm nào khớp với &quot;
                        {debouncedSearchTerm}&quot;.
                      </div>
                    )}

                  {suggestedProducts.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                      {suggestedProducts.map((product) => (
                        <li key={product._id} className="hover:bg-gray-50">
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={() => setIsSearchBarActive(false)} // Đóng search bar khi click gợi ý
                            className="flex items-center p-3 text-sm"
                          >
                            <Image
                              src={
                                product.images?.[0] || "/placeholder-image.jpg"
                              }
                              alt={product.name}
                              width={40}
                              height={40}
                              className="mr-3 h-10 w-10 flex-shrink-0 rounded-md object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-gray-800">
                                {product.name}
                              </p>
                              <p className="text-xs font-semibold text-indigo-600">
                                {formatCurrency(product.displayPrice)}
                                {product.isOnSale &&
                                  product.price > product.displayPrice && (
                                    <span className="ml-2 text-[11px] text-gray-400 line-through">
                                      {formatCurrency(product.price)}
                                    </span>
                                  )}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                      {suggestedProducts.length > 0 && searchTerm.trim() && (
                        <li className="p-3 text-center">
                          <button
                            onClick={() => handleSearchSubmit()}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            Xem tất cả kết quả cho &quot;{searchTerm.trim()}
                            &quot;
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
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
      />
    </>
  );
}
