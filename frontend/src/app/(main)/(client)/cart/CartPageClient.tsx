"use client";

import CartItemList from "@/components/client/cart/CartItemList";
import CartSummary from "@/components/client/cart/CartSummary";
import { useGetCart } from "@/lib/react-query/cartQueries";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiLoader, FiShoppingCart, FiTag } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query"; // Dùng để fetch categories
import { getAllCategories } from "@/services/categoryService"; // Hàm service mới (sẽ tạo)
import { Category } from "@/types/category";

export default function CartPageClient() {
  const { data: cart, isLoading, isError, error, refetch } = useGetCart();

  // State để lưu trữ ID của các cart items đã được chọn
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [hasInitializedSelectedItems, setHasInitializedSelectedItems] =
    useState(false);

  // Khởi tạo: chọn tất cả các item khi giỏ hàng được load lần đầu
  useEffect(() => {
    // Chỉ khởi tạo selectedItemIds một lần khi cart có items và chưa được khởi tạo
    if (cart && cart.items.length > 0 && !hasInitializedSelectedItems) {
      setSelectedItemIds(new Set());
      setHasInitializedSelectedItems(true); // Đánh dấu đã khởi tạo
    } else if (
      (!cart || cart.items.length === 0) &&
      hasInitializedSelectedItems
    ) {
      // Nếu giỏ hàng trở nên rỗng sau khi đã khởi tạo, reset lại
      setHasInitializedSelectedItems(false); // Cho phép khởi tạo lại nếu sau đó có item
    }
  }, [cart, hasInitializedSelectedItems]);

  const handleSelectItem = (itemId: string, isSelected: boolean) => {
    setSelectedItemIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (isSelected) {
        newSelectedIds.add(itemId);
      } else {
        newSelectedIds.delete(itemId);
      }
      return newSelectedIds;
    });
  };

  const handleSelectAllItems = (isSelected: boolean) => {
    if (cart && cart.items) {
      if (isSelected) {
        setSelectedItemIds(new Set(cart.items.map((item) => item._id)));
      } else {
        setSelectedItemIds(new Set());
      }
    }
  };

  // Lọc ra các items đã được chọn để truyền xuống CartSummary
  const selectedItems = useMemo(() => {
    if (!cart) return [];
    return cart.items.filter((item) => selectedItemIds.has(item._id));
  }, [cart, selectedItemIds]);

  // Kiểm tra xem tất cả item có được chọn không (cho checkbox "Chọn tất cả")
  const isAllSelected = useMemo(() => {
    if (!cart || cart.items.length === 0) return false;
    return cart.items.length === selectedItemIds.size;
  }, [cart, selectedItemIds]);

  // Fetch tất cả các active categories để dùng cho CouponSection
  const { data: allActiveCategories, isLoading: isLoadingCategories } = useQuery<Category[], Error>({
    queryKey: ['allActiveCategoriesForCart'],
    queryFn: () => getAllCategories({ isActive: true }), // Lấy các category active
    staleTime: 1000 * 60 * 60, // Cache 1 giờ
  });

  // Tạo categoryMap ở client
  const activeCategoryMapClient = useMemo(() => {
    const map = new Map<string, Category>();
    if (allActiveCategories) {
      allActiveCategories.forEach(cat => map.set(cat._id.toString(), cat));
    }
    return map;
  }, [allActiveCategories]);

  // Hàm getCategoryAncestors client-side
  const getCategoryAncestorsClient = (categoryId: string, categoryMap: Map<string, Category>): string[] => {
    if (!categoryId) return [];
    const ancestors = [];
    let currentId = categoryId;
    for (let i = 0; i < 10 && currentId; i++) { // Giới hạn vòng lặp tránh vô hạn
      const category = categoryMap.get(currentId);
      if (category && category.parent) {
        const parentId = typeof category.parent === 'string' ? category.parent : category.parent._id.toString();
        if (parentId) {
            ancestors.push(parentId);
            currentId = parentId;
        } else {
            currentId = ""; // Ngắt vòng lặp nếu parent không hợp lệ
        }
      } else {
        currentId = ""; // Ngắt vòng lặp
      }
    }
    return ancestors;
  };

  if (isLoading || isLoadingCategories) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <FiLoader className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="my-12 rounded-md bg-red-50 p-6 text-center shadow">
        <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-3 text-xl font-semibold text-red-700">
          Lỗi tải giỏ hàng
        </h3>
        <p className="mt-2 text-sm text-red-600">
          {error?.message || "Đã có lỗi xảy ra."}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-6 rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="my-12 flex flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-lg">
        <FiShoppingCart className="h-20 w-20 text-gray-300" />
        <h2 className="mt-6 text-2xl font-semibold text-gray-800">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="mt-3 text-gray-600">
          Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-lg bg-indigo-600 px-8 py-3 text-base font-medium text-white shadow-md transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <FiTag className="mr-2 h-5 w-5" />
          Bắt đầu mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-6 flex flex-row items-center justify-between gap-y-2 lg:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Giỏ hàng
        </h1>
        {cart.items.length > 0 && (
          <div className="flex items-center">
            <input
              id="select-all-cart-items"
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-indigo-600"
              checked={isAllSelected}
              onChange={(e) => handleSelectAllItems(e.target.checked)}
            />
            <label
              htmlFor="select-all-cart-items"
              className="ml-2 text-sm text-gray-700"
            >
              Chọn tất cả
            </label>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-12">
        <section aria-labelledby="cart-heading" className="lg:col-span-8">
          <h2 id="cart-heading" className="sr-only">
            Sản phẩm trong giỏ hàng của bạn
          </h2>
          <CartItemList
            items={cart.items}
            selectedItemIds={selectedItemIds}
            onSelectItem={handleSelectItem}
          />
        </section>
        <CartSummary
          originalCart={cart}
          selectedItemsForSummary={selectedItems}
          categoryMap={activeCategoryMapClient}
          getAncestorsFn={getCategoryAncestorsClient}
        />
      </div>
    </div>
  );
}
