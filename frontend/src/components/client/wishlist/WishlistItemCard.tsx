"use client";

import { useAddToCart } from "@/lib/react-query/cartQueries";
import { formatCurrency } from "@/lib/utils";
import { AppDispatch } from "@/store";
import { addPopup } from "@/store/slices/notificationPopupSlice"; // Import action và type
import { WishlistItem } from "@/types";
import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiLoader, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { useDispatch } from "react-redux";

interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: (productId: string, variantId?: string | null) => void;
  isRemoving: boolean;
}

export default function WishlistItemCard({
  item,
  onRemove,
  isRemoving,
}: WishlistItemCardProps) {
  const dispatch: AppDispatch = useDispatch(); // Khởi tạo dispatch
  const addToCartMutation = useAddToCart();

  // --- Logic quản lý ảnh hover ---
  const getInitialImage = useCallback(() => {
    // Ưu tiên ảnh của variantDetails (nếu người dùng thích variant)
    if (item.variantDetails?.images && item.variantDetails.images.length > 0) {
      return item.variantDetails.images[0];
    }
    // Sau đó là ảnh chính của sản phẩm
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    return "/placeholder-image.jpg";
  }, [item.variantDetails, item.images]);

  const [currentImage, setCurrentImage] = useState<string>(getInitialImage);

  // Cập nhật ảnh khi item prop thay đổi
  useEffect(() => {
    setCurrentImage(getInitialImage());
  }, [item, getInitialImage]);

  const handleMouseEnterCard = () => {
    const imagesToShowFrom = item.variantDetails?.images || item.images;
    if (imagesToShowFrom && imagesToShowFrom.length > 1) {
      setCurrentImage(imagesToShowFrom[1]); // Hiển thị ảnh thứ 2
    }
  };

  const handleMouseLeaveCard = () => {
    setCurrentImage(getInitialImage()); // Quay lại ảnh đầu tiên
  };
  // --- Kết thúc logic ảnh hover ---

  const name = item.name;
  const slug = item.slug;
  const wishlistedVariantId = item.wishlistedVariantId;

  // Thông tin hiển thị, ưu tiên variantDetails
  const displayPrice = item.variantDetails?.displayPrice ?? item.displayPrice;
  const originalPrice = item.variantDetails?.price ?? item.price;
  const isOnSale = item.variantDetails?.isOnSale ?? item.isOnSale;
  const stockQuantity =
    item.variantDetails?.stockQuantity ?? item.stockQuantity;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (stockQuantity === 0) {
      toast.error("Sản phẩm này hiện đã hết hàng.");
      return;
    }

    addToCartMutation.mutate(
      {
        productId: item._id,
        variantId: wishlistedVariantId,
        quantity: 1,
      },
      {
        onSuccess: (updatedCartData) => {
          // Tìm item vừa được thêm/cập nhật trong giỏ hàng mới
          const addedOrUpdatedItemInCart = updatedCartData.items.find(
            (cartItem) =>
              cartItem.productId === item._id &&
              (cartItem.variantId === wishlistedVariantId ||
                (!cartItem.variantId && !wishlistedVariantId)),
          );

          if (addedOrUpdatedItemInCart) {
            dispatch(addPopup(addedOrUpdatedItemInCart));
          } else {
            // Fallback nếu không tìm thấy chính xác, tạo item cơ bản cho popup
            const fallbackPopupItem = {
              _id: `temp-${Date.now()}`, // Hoặc dùng item._id nếu không có variant
              productId: item._id,
              name: item.name,
              price: displayPrice,
              quantity: 1, // Số lượng vừa thêm
              image: currentImage, // Ảnh đang hiển thị
              slug: item.slug,
              availableStock: stockQuantity,
              variantInfo: item.variantDetails
                ? {
                    _id: item.variantDetails._id,
                    options: item.variantDetails.optionValues.map((opt) => ({
                      attributeName: opt.attributeName,
                      value: opt.value,
                    })),
                    sku: item.variantDetails.sku,
                  }
                : undefined,
              sku: "",
              lineTotal: 0,
            };
            dispatch(addPopup(fallbackPopupItem));
            toast.success(`Đã thêm "${name}" vào giỏ hàng!`);
          }
        },
      },
    );
  };

  const linkToProduct = `/products/${slug}${wishlistedVariantId ? `?variant=${wishlistedVariantId}` : ""}`;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 ease-in-out hover:shadow-lg"
      onMouseEnter={handleMouseEnterCard} // Thêm sự kiện hover
      onMouseLeave={handleMouseLeaveCard} // Thêm sự kiện rời hover
    >
      <Link href={linkToProduct} className="block">
        <div className="relative aspect-[1/1] w-full overflow-hidden bg-gray-100 sm:aspect-[9/10]">
          <Image
            src={currentImage}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            priority={false}
          />
        </div>
      </Link>

      {/* Badge sale */}
      {isOnSale && displayPrice < originalPrice && (
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-md bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700 sm:text-xs">
            -
            {Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}
            %
          </span>
        </div>
      )}
      {/* Nút xóa */}
      <button
        onClick={() => onRemove(item._id, wishlistedVariantId)}
        disabled={isRemoving}
        className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-gray-500 backdrop-blur-sm transition-all hover:bg-red-500 hover:text-white disabled:opacity-50 sm:top-3 sm:right-3"
        title="Xóa khỏi yêu thích"
        aria-label="Xóa khỏi yêu thích"
      >
        {isRemoving ? (
          <FiLoader className="h-4 w-4 animate-spin" />
        ) : (
          <FiTrash2 className="h-4 w-4" />
        )}
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {item.variantDetails?.optionValues &&
          item.variantDetails.optionValues.length > 0 && (
            <p className="mb-1 truncate text-xs text-gray-500">
              {item.variantDetails.optionValues
                .map((opt) => `${opt.attributeName}: ${opt.value}`)
                .join(" / ")}
            </p>
          )}
        <h3 className="mb-2 line-clamp-2 flex-grow text-sm font-medium text-gray-800 transition-colors hover:text-indigo-600 sm:text-base">
          <Link href={linkToProduct}>{name}</Link>
        </h3>

        <div className="mt-auto">
          <div className="mb-2 flex items-baseline">
            <p
              className={classNames(
                "font-semibold",
                { "text-red-600": isOnSale },
                { "text-gray-800": !isOnSale },
                "text-base sm:text-lg",
              )}
            >
              {formatCurrency(displayPrice)}
            </p>
            {isOnSale && displayPrice < originalPrice && (
              <p className="ml-2 text-xs text-gray-400 line-through sm:text-sm">
                {formatCurrency(originalPrice)}
              </p>
            )}
          </div>
          {stockQuantity === 0 && (
            <p className="mb-2 text-xs font-medium text-red-500">Hết hàng</p>
          )}
          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || stockQuantity === 0}
            className={classNames(
              "inline-flex w-full items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none",
              stockQuantity === 0
                ? "cursor-not-allowed bg-gray-400"
                : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
              { "cursor-wait opacity-70": addToCartMutation.isPending },
            )}
            aria-label="Thêm vào giỏ hàng"
          >
            {addToCartMutation.isPending ? (
              <FiLoader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FiShoppingCart className="mr-2 h-4 w-4" />
            )}
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}
