"use client";
import { useAddToCart } from "@/lib/react-query/cartQueries";
import {
  useAddToWishlist,
  useGetWishlist,
  useRemoveFromWishlist,
} from "@/lib/react-query/wishlistQueries";
import { Product, Variant } from "@/types";
import { CartItem } from "@/types/cart";
import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiHeart, FiLoader, FiShoppingCart } from "react-icons/fi"; // Thêm FiLoader
import AddedToCartPopup from "./AddedToCartPopup";

const formatCurrency = (
  amount: number | undefined | null,
  defaultValue: string = "Liên hệ",
): string => {
  if (typeof amount !== "number" || isNaN(amount)) {
    return defaultValue;
  }
  try {
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  } catch (error) {
    console.error("Lỗi định dạng tiền tệ:", error, "Với giá trị:", amount);
    return defaultValue;
  }
};

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [showAddedToCartPopup, setShowAddedToCartPopup] = useState(false);
  const [justAddedItem, setJustAddedItem] = useState<CartItem | null>(null);
  const addToCartMutation = useAddToCart();

  // --- Wishlist Logic ---
  const { data: wishlistData, isLoading: isLoadingWishlist } = useGetWishlist();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  const isFavorite = useMemo(() => {
    if (!wishlistData) return false;
    return wishlistData.some((item) => item._id === product._id);
  }, [wishlistData, product._id]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Ngăn chặn click liên tục khi đang xử lý
    if (
      addToWishlistMutation.isPending ||
      removeFromWishlistMutation.isPending
    ) {
      return;
    }

    if (isFavorite) {
      removeFromWishlistMutation.mutate(product._id, {
        onError: (error) => {
          console.error("Lỗi xóa khỏi wishlist trên card:", error);
        },
      });
    } else {
      addToWishlistMutation.mutate(product._id, {
        onError: (error) => {
          console.error("Lỗi thêm vào wishlist trên card:", error);
        },
      });
    }
  };
  // --- Kết thúc Wishlist Logic ---

  const getInitialProductImage = useCallback(() => {
    if (product.images && product.images.length > 0 && product.images[0]) {
      return product.images[0];
    }
    const firstVariantWithImg = product.variants?.find(
      (v) => v.images && v.images.length > 0 && v.images[0],
    );
    if (firstVariantWithImg?.images?.[0]) {
      return firstVariantWithImg.images[0];
    }
    return "/placeholder-image.jpg";
  }, [product.images, product.variants]);

  const [activeVariant, setActiveVariant] = useState<Variant | null>(null);
  const [currentImage, setCurrentImage] = useState<string>(() =>
    getInitialProductImage(),
  );

  useEffect(() => {
    setActiveVariant(null);
    setCurrentImage(getInitialProductImage());
  }, [product, getInitialProductImage]);

  const handleMouseEnterCard = () => {
    if (!activeVariant && product.images && product.images.length > 1) {
      setCurrentImage(product.images[1]);
    }
  };

  const handleMouseLeaveCard = () => {
    if (activeVariant?.images?.[0]) {
      setCurrentImage(activeVariant.images[0]);
    } else {
      setCurrentImage(getInitialProductImage());
    }
  };

  const handleColorInteraction = (
    variant: Variant | null,
    interactionType: "enter" | "leave" | "click",
  ) => {
    if (interactionType === "enter") {
      if (variant?.images?.[0]) {
        setCurrentImage(variant.images[0]);
      } else {
        setCurrentImage(getInitialProductImage());
      }
    } else if (interactionType === "click") {
      setActiveVariant(variant);
      if (variant?.images?.[0]) {
        setCurrentImage(variant.images[0]);
      } else {
        setCurrentImage(getInitialProductImage());
      }
    } else if (interactionType === "leave") {
      if (activeVariant?.images?.[0]) {
        setCurrentImage(activeVariant.images[0]);
      } else {
        setCurrentImage(getInitialProductImage());
      }
    }
  };

  const colorAttributeName = "Màu sắc";
  const uniqueColorVariants = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return [];
    const colorMap = new Map<string, Variant>();
    product.variants.forEach((variant) => {
      const colorOpt = variant.optionValues.find(
        (opt) => opt.attributeName === colorAttributeName,
      );
      if (colorOpt && colorOpt.value && !colorMap.has(colorOpt.value)) {
        colorMap.set(colorOpt.value, variant);
      }
    });
    return Array.from(colorMap.values());
  }, [product.variants]);

  const displayPriceToShow =
    activeVariant?.displayPrice ?? product.displayPrice;
  const originalPriceToShow = activeVariant?.price ?? product.price;
  const isOnSaleToShow = activeVariant?.isOnSale ?? product.isOnSale;

  const percentageDiscount =
    isOnSaleToShow &&
    originalPriceToShow > 0 &&
    displayPriceToShow < originalPriceToShow
      ? Math.round(
          ((originalPriceToShow - displayPriceToShow) / originalPriceToShow) *
            100,
        )
      : 0;

  const imageToDisplay = currentImage;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productIdToAdd = product._id;
    const variantIdToAdd = activeVariant?._id || null;

    if (!productIdToAdd) {
      toast.error("Không xác định được sản phẩm.");
      return;
    }
    if (product.variants && product.variants.length > 0 && !activeVariant) {
      toast.error(
        "Vui lòng chọn một phiên bản sản phẩm (ví dụ: màu sắc, size).",
      );
      return;
    }

    const cartItemData = {
      productId: productIdToAdd,
      variantId: variantIdToAdd,
      quantity: 1,
    };

    console.log("🛒 [ProductCard] Data being sent to addToCartMutation:", {
      productName: product.name,
      ...cartItemData,
    });

    addToCartMutation.mutate(cartItemData, {
      onSuccess: (updatedCartData) => {
        const addedOrUpdatedItem = updatedCartData.items.find(
          (item) =>
            item.productId === productIdToAdd &&
            (item.variantId === variantIdToAdd ||
              (!item.variantId && !variantIdToAdd)),
        );

        if (addedOrUpdatedItem) {
          setJustAddedItem(addedOrUpdatedItem);
          setShowAddedToCartPopup(true);
        } else {
          if (updatedCartData.items.length > 0) {
            setJustAddedItem(
              updatedCartData.items[updatedCartData.items.length - 1],
            );
            setShowAddedToCartPopup(true);
          } else {
            toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
          }
        }
      },
    });
  };

  const isWishlistActionPending =
    addToWishlistMutation.isPending || removeFromWishlistMutation.isPending;

  return (
    <>
      <div
        className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
        onMouseEnter={handleMouseEnterCard}
        onMouseLeave={handleMouseLeaveCard}
      >
        <div className="relative">
          <Link
            href={`/products/${product.slug}${activeVariant ? `?variant=${activeVariant._id}` : ""}`}
            className="block aspect-square w-full overflow-hidden bg-gray-100"
          >
            <Image
              src={imageToDisplay}
              alt={
                product.name +
                (activeVariant
                  ? ` - ${activeVariant.optionValues.map((ov) => ov.value).join(" ")}`
                  : "")
              }
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-105"
              priority={false}
              onError={(e) => {
                if (e.currentTarget.src !== "/placeholder-image.jpg") {
                  e.currentTarget.src = "/placeholder-image.jpg";
                }
              }}
            />
          </Link>
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end space-y-1.5">
            {product.isNew && (
              <span className="rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-green-700 uppercase sm:text-xs">
                Mới
              </span>
            )}
            {isOnSaleToShow && percentageDiscount > 0 && (
              <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 sm:text-xs">
                -{percentageDiscount}%
              </span>
            )}
            {product.totalSold != null &&
              product.totalSold > 30 &&
              !product.isNew && (
                <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-orange-700 uppercase sm:text-xs">
                  Bán Chạy
                </span>
              )}
          </div>
          {/* Action buttons */}
          <div className="absolute right-0 bottom-0 left-0 z-10 flex translate-y-2 justify-center space-x-3 bg-gradient-to-t from-black/20 via-black/10 to-transparent pt-8 pb-3 opacity-0 transition-all duration-300 ease-in-out group-hover:translate-y-1 group-hover:transform group-hover:opacity-100">
            <button
              onClick={handleToggleWishlist}
              disabled={isLoadingWishlist || isWishlistActionPending} // Vô hiệu hóa khi đang tải wishlist hoặc đang thực hiện action
              title={isFavorite ? "Xóa khỏi Yêu thích" : "Thêm vào Yêu thích"}
              className={classNames(
                "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                {
                  "text-red-500 hover:bg-red-500 hover:text-white focus-visible:ring-red-500":
                    isFavorite,
                  "text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400":
                    !isFavorite,
                  "cursor-not-allowed opacity-70":
                    isLoadingWishlist || isWishlistActionPending,
                },
              )}
              aria-label={
                isFavorite ? "Xóa khỏi Yêu thích" : "Thêm vào Yêu thích"
              }
            >
              {isWishlistActionPending ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                <FiHeart
                  className={classNames("h-5 w-5", {
                    "fill-current": isFavorite,
                  })}
                />
              )}
            </button>
            <button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
              title="Thêm vào giỏ hàng"
              className={classNames(
                "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-indigo-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                {
                  "cursor-not-allowed opacity-70": addToCartMutation.isPending,
                },
              )}
              aria-label="Thêm vào giỏ hàng"
            >
              {addToCartMutation.isPending ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                <FiShoppingCart className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-grow flex-col p-3 sm:p-4">
          {uniqueColorVariants.length > 0 && (
            <div className="mb-2.5 flex h-7 items-center space-x-1.5 pb-1">
              {uniqueColorVariants.map((variant) => {
                const colorOpt = variant.optionValues.find(
                  (opt) => opt.attributeName === colorAttributeName,
                );
                if (!colorOpt) return null;
                const colorValue = colorOpt.value;
                const colorHex = colorValue.toLowerCase().includes("đen")
                  ? "#2D3748"
                  : colorValue.toLowerCase().includes("trắng")
                    ? "#FFFFFF"
                    : colorValue.toLowerCase().includes("xanh navy")
                      ? "#2c5282"
                      : colorValue.toLowerCase().includes("xanh đậm")
                        ? "#006400"
                        : colorValue.toLowerCase().includes("xanh nhạt")
                          ? "#ADD8E6"
                          : colorValue.toLowerCase().includes("xám")
                            ? "#A0AEC0"
                            : colorValue.toLowerCase().includes("be")
                              ? "#F5F5DC"
                              : colorValue.toLowerCase().includes("hồng")
                                ? "#FBB6CE"
                                : colorValue.toLowerCase().includes("đỏ")
                                  ? "#E53E3E"
                                  : colorValue.toLowerCase().includes("vàng")
                                    ? "#ECC94B"
                                    : "#E2E8F0";
                const isCurrentlyActive = activeVariant?._id === variant._id;

                return (
                  <button
                    type="button"
                    key={variant._id}
                    title={colorValue}
                    onMouseEnter={() =>
                      handleColorInteraction(variant, "enter")
                    }
                    onMouseLeave={() => handleColorInteraction(null, "leave")}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleColorInteraction(variant, "click");
                    }}
                    className={classNames(
                      "h-5 w-5 flex-shrink-0 cursor-pointer rounded-full border-2 shadow-sm transition-all duration-150 focus:outline-none sm:h-6 sm:w-6",
                      isCurrentlyActive
                        ? "scale-110 border-indigo-500 ring-1 ring-indigo-500 ring-offset-1"
                        : "border-gray-300 hover:border-gray-400",
                      {
                        "border-black":
                          colorHex === "#FFFFFF" && !isCurrentlyActive,
                      },
                    )}
                    style={{ backgroundColor: colorHex }}
                    aria-label={`Chọn màu ${colorValue}`}
                  />
                );
              })}
            </div>
          )}
          <h3 className="line-clamp-2 min-h-[2.75em] flex-grow text-sm font-medium text-gray-700 transition-colors group-hover:text-indigo-600 sm:min-h-[3em] sm:text-base">
            <Link
              href={`/products/${product.slug}${activeVariant ? `?variant=${activeVariant._id}` : ""}`}
            >
              {product.name}
            </Link>
          </h3>
          <div className="mt-2 flex flex-wrap items-baseline justify-start">
            <span className="mr-2 text-base font-bold text-indigo-600 sm:text-lg">
              {formatCurrency(displayPriceToShow)}
            </span>
            {isOnSaleToShow && originalPriceToShow > displayPriceToShow && (
              <span className="text-xs text-gray-500 line-through sm:text-sm">
                {formatCurrency(originalPriceToShow)}
              </span>
            )}
          </div>
        </div>
      </div>
      <AddedToCartPopup
        item={justAddedItem}
        isOpen={showAddedToCartPopup}
        onClose={() => setShowAddedToCartPopup(false)}
      />
    </>
  );
}
