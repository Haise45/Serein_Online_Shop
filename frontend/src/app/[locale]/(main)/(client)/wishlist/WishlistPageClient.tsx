"use client";

import WishlistItemCard from "@/components/client/wishlist/WishlistItemCard";
import {
  useGetWishlist,
  useRemoveFromWishlist,
} from "@/lib/react-query/wishlistQueries";
import Link from "next/link";
import { FiAlertCircle, FiHeart, FiLoader } from "react-icons/fi";
import { useGetAttributes } from "@/lib/react-query/attributeQueries";
import { useSettings } from "@/app/SettingsContext";
import { useTranslations } from "next-intl";

export default function WishlistPageClient() {
  const t = useTranslations("WishlistPage");

  const {
    data: wishlistItems,
    isLoading: isLoadingWishlist,
    isError,
    error,
    refetch,
  } = useGetWishlist();

  const { data: attributes, isLoading: isLoadingAttributes } =
    useGetAttributes();

  // *** LẤY THÔNG TIN TIỀN TỆ TỪ CONTEXT ***
  const settingsContext = useSettings();
  const displayCurrency = settingsContext?.displayCurrency || "VND";
  const rates = settingsContext?.rates || null;

  const removeFromWishlistMutation = useRemoveFromWishlist();

  const isLoading =
    isLoadingWishlist || isLoadingAttributes || settingsContext.isLoading;

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <FiLoader className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
        <p className="mt-3 text-sm text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <FiAlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <p className="mt-3 text-base font-medium text-red-600">
          {t("errorTitle")}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {error?.message || t("errorMessage")}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-6 rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t("retryButton")}
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
          {t("emptyTitle")}
        </p>
        <p className="mt-3 max-w-md text-sm text-gray-600">
          {t("emptySubtitle")}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-8 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          {t("exploreButton")}
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
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 sm:mt-0">
          {t("itemCount", { count: wishlistItems.length })}
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
            attributes={attributes || []}
            displayCurrency={displayCurrency}
            rates={rates}
          />
        ))}
      </div>
    </div>
  );
}
