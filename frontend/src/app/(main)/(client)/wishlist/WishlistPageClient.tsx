"use client";

import WishlistItemCard from "@/components/client/wishlist/WishlistItemCard";
import {
  useGetWishlist,
  useRemoveFromWishlist,
} from "@/lib/react-query/wishlistQueries";
import Link from "next/link";
import { FiAlertCircle, FiHeart, FiLoader } from "react-icons/fi";

export default function WishlistPageClient() {
  const {
    data: wishlistItems,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <FiLoader className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
        <p className="mt-3 text-sm text-gray-500">
          Đang tải danh sách yêu thích...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <FiAlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <p className="mt-3 text-base font-medium text-red-600">
          Lỗi tải danh sách yêu thích
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {error?.message || "Đã có lỗi không mong muốn xảy ra."}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-6 rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="my-12 flex flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-lg">
        <FiHeart className="mx-auto h-20 w-20 text-gray-300" />{" "}
        {/* Icon to hơn */}
        <p className="mt-6 text-2xl font-semibold text-gray-800">
          Danh sách yêu thích của bạn trống
        </p>
        <p className="mt-3 max-w-md text-sm text-gray-600">
          Có vẻ như bạn chưa thêm sản phẩm nào vào đây. Hãy bắt đầu khám phá và
          lưu lại những món đồ bạn yêu thích nhé!
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-8 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  const handleRemoveItem = (productId: string, variantId?: string | null) => {
    removeFromWishlistMutation.mutate({ productId, variantId });
  };

  return (
    <div className="mt-6 sm:mt-8">
      <div className="mb-6 flex flex-col items-center text-center sm:mb-8 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Danh Sách Yêu Thích
        </h1>
        <p className="mt-1 text-sm text-gray-500 sm:mt-0">
          {wishlistItems.length} sản phẩm
        </p>
      </div>
      {/* Điều chỉnh grid layout để card to hơn và có khoảng cách phù hợp */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 md:gap-x-6 md:gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
        {wishlistItems.map((item) => (
          <WishlistItemCard
            key={item._id + (item.wishlistedVariantId || "")}
            item={item}
            onRemove={handleRemoveItem}
            isRemoving={
              removeFromWishlistMutation.isPending &&
              removeFromWishlistMutation.variables?.productId === item._id &&
              removeFromWishlistMutation.variables?.variantId ===
                item.wishlistedVariantId
            }
          />
        ))}
      </div>
    </div>
  );
}
