"use client";

import { useAddToCart } from "@/lib/react-query/cartQueries";
import { formatCurrency } from "@/lib/utils";
import { AppDispatch } from "@/store";
import { addPopup } from "@/store/slices/notificationPopupSlice";
import { Attribute, WishlistItem } from "@/types";
import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle, FiLoader, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { useDispatch } from "react-redux";

interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: (productId: string, variantId?: string | null) => void;
  isRemoving: boolean;
  attributes: Attribute[];
}

export default function WishlistItemCard({
  item,
  onRemove,
  isRemoving,
  attributes,
}: WishlistItemCardProps) {
  const dispatch: AppDispatch = useDispatch();
  const addToCartMutation = useAddToCart();

  // Tạo bộ đệm tra cứu
  const attributeMap = useMemo(() => {
    if (!attributes) return new Map();
    const map = new Map<string, { label: string; values: Map<string, string> }>();
    attributes.forEach((attr) => {
      const valueMap = new Map<string, string>();
      attr.values.forEach((val) => valueMap.set(val._id, val.value));
      map.set(attr._id, { label: attr.label, values: valueMap });
    });
    return map;
  }, [attributes]);

  // Logic hiển thị tên biến thể
  const variantDisplayName = useMemo(() => {
    if (!item.variantDetails?.optionValues) return null;
    return item.variantDetails.optionValues
      .map((opt) => {
        const attrId = typeof opt.attribute === "string" ? opt.attribute : opt.attribute._id;
        const valueId = typeof opt.value === "string" ? opt.value : opt.value._id;
        const attrInfo = attributeMap.get(attrId);
        const valueName = attrInfo?.values.get(valueId);
        return `${attrInfo?.label || "Thuộc tính"}: ${valueName || "N/A"}`;
      })
      .join(" / ");
  }, [item.variantDetails, attributeMap]);

  // Logic quản lý ảnh hover
  const getInitialImage = useCallback(() => {
    if (item.variantDetails?.images && item.variantDetails.images.length > 0) {
      return item.variantDetails.images[0];
    }
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    return "/placeholder-image.jpg";
  }, [item.variantDetails, item.images]);

  const [currentImage, setCurrentImage] = useState<string>(getInitialImage);

  useEffect(() => {
    setCurrentImage(getInitialImage());
  }, [item, getInitialImage]);

  const handleMouseEnterCard = () => {
    const imagesToShowFrom = item.variantDetails?.images || item.images;
    if (imagesToShowFrom && imagesToShowFrom.length > 1) {
      setCurrentImage(imagesToShowFrom[1]);
    }
  };

  const handleMouseLeaveCard = () => {
    setCurrentImage(getInitialImage());
  };

  // Các giá trị hiển thị
  const name = item.name;
  const slug = item.slug;
  const wishlistedVariantId = item.wishlistedVariantId;

  const displayPrice = item.variantDetails?.displayPrice ?? item.displayPrice;
  const originalPrice = item.variantDetails?.price ?? item.price;
  const isOnSale = item.variantDetails?.isOnSale ?? item.isOnSale;
  
  // Xử lý stockQuantity và isOutOfStock
  const stockQuantity = item.variantDetails?.stockQuantity ?? item.stockQuantity;
  const isOutOfStock = stockQuantity === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
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
          const addedOrUpdatedItemInCart = updatedCartData.items.find(
            (cartItem) =>
              cartItem.productId === item._id &&
              (cartItem.variantId === wishlistedVariantId ||
                (!cartItem.variantId && !wishlistedVariantId)),
          );

          if (addedOrUpdatedItemInCart) {
            dispatch(addPopup(addedOrUpdatedItemInCart));
          } else {
            // Fallback (giữ nguyên)
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
      onMouseEnter={handleMouseEnterCard}
      onMouseLeave={handleMouseLeaveCard}
    >
      <Link href={linkToProduct} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
          <Image
            src={currentImage}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={classNames(
              "object-cover object-center transition-transform duration-300",
              // Thêm hiệu ứng mờ nếu hết hàng
              { "opacity-50 grayscale": isOutOfStock }
            )}
            priority={false}
          />
          {/* Lớp phủ thông báo hết hàng */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-lg">Hết hàng</span>
            </div>
          )}
        </div>
      </Link>

      {/* Badge sale */}
      {isOnSale && displayPrice < originalPrice && !isOutOfStock && (
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
        {variantDisplayName && (
          <p className="mb-1 truncate text-xs text-gray-500">
            {variantDisplayName}
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
                { "text-red-600": isOnSale && !isOutOfStock },
                { "text-gray-800": !isOnSale || isOutOfStock },
                "text-base sm:text-lg",
              )}
            >
              {formatCurrency(displayPrice)}
            </p>
            {isOnSale && displayPrice < originalPrice && !isOutOfStock && (
              <p className="ml-2 text-xs text-gray-400 line-through sm:text-sm">
                {formatCurrency(originalPrice)}
              </p>
            )}
          </div>
          
          {/* Thông báo hết hàng rõ ràng hơn */}
          {isOutOfStock && (
             <div className="mb-2 flex items-center text-xs font-semibold text-red-600">
                <FiAlertCircle className="mr-1.5 h-4 w-4" />
                <span>Sản phẩm tạm hết hàng</span>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || isOutOfStock}
            className={classNames(
              "inline-flex w-full items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none",
              isOutOfStock
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
            {/* Thay đổi text của nút */}
            {isOutOfStock ? "Đã hết hàng" : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    </div>
  );
}