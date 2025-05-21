"use client";
import { useAddToCart } from "@/lib/react-query/cartQueries";
import {
  useAddToWishlist,
  useGetWishlist,
  useRemoveFromWishlist,
} from "@/lib/react-query/wishlistQueries";
import { AppDispatch } from "@/store"; // Thêm AppDispatch
import { addPopup } from "@/store/slices/notificationPopupSlice";
import { Product, Variant } from "@/types";
import { CartItem } from "@/types/cart";
import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiHeart, FiLoader, FiShoppingCart } from "react-icons/fi";
import { useDispatch } from "react-redux";

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
  const MAX_VISIBLE_COLORS = 4;
  const dispatch: AppDispatch = useDispatch(); // Khởi tạo dispatch
  const addToCartMutation = useAddToCart();

  const { data: wishlistData, isLoading: isLoadingWishlist } = useGetWishlist();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  const [activeVariant, setActiveVariant] = useState<Variant | null>(null);

  const isFavorite = useMemo(() => {
    if (!wishlistData || !product) return false;

    if (activeVariant) {
      // Nếu một variant đang được active, kiểm tra xem chính xác variant đó có trong wishlist không
      return wishlistData.some(
        (item) =>
          item._id === product._id && // So sánh productId của item trong wishlist với product._id
          item.wishlistedVariantId === activeVariant._id,
      );
    } else {
      // Nếu không có variant nào active (đang xem sản phẩm chung)
      // Kiểm tra xem có BẤT KỲ variant nào của sản phẩm này được thích không
      if (product.variants && product.variants.length > 0) {
        return wishlistData.some(
          (item) =>
            item._id === product._id && // So sánh productId
            item.wishlistedVariantId !== null && // Đảm bảo item này là một variant đã thích
            product.variants.some((pv) => pv._id === item.wishlistedVariantId), // Kiểm tra xem variant đã thích đó có thuộc sản phẩm hiện tại không
        );
      } else {
        // Sản phẩm không có variant, kiểm tra xem sản phẩm chung (không có variantId) có được thích không
        return wishlistData.some(
          (item) => item._id === product._id && !item.wishlistedVariantId,
        );
      }
    }
  }, [wishlistData, product, activeVariant]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      addToWishlistMutation.isPending ||
      removeFromWishlistMutation.isPending
    ) {
      return;
    }

    // Trường hợp 1: Đang xem sản phẩm chung (chưa chọn variant), sản phẩm có variant,
    // và icon trái tim đang active (do một variant nào đó đã được thích)
    if (
      product.variants &&
      product.variants.length > 0 &&
      !activeVariant &&
      isFavorite
    ) {
      toast.success(
        "Một phiên bản của sản phẩm này đã được yêu thích. Hãy chọn phiên bản để quản lý.",
        { icon: "ℹ️" },
      );
      return;
    }

    // Trường hợp 2: Sản phẩm có variant, chưa chọn variant, và muốn THÊM MỚI vào wishlist (icon chưa active)
    if (
      product.variants &&
      product.variants.length > 0 &&
      !activeVariant &&
      !isFavorite
    ) {
      toast.error(
        "Vui lòng chọn một phiên bản (ví dụ: màu sắc) để thêm vào yêu thích.",
      );
      return;
    }

    // Từ đây, hoặc là sản phẩm không có variant, hoặc đã chọn activeVariant,
    // hoặc đang xóa một variant cụ thể đã được thích.
    const productIdToToggle = product._id;
    const variantIdToToggle = activeVariant?._id || null; // Nếu không có activeVariant, đây là thích/bỏ thích sản phẩm chung

    // Xác định lại isCurrentlyFavorite cho hành động cụ thể này, vì 'isFavorite' state có thể đang chỉ báo trạng thái tổng hợp
    let isCurrentlyFavoriteForAction = false;
    if (activeVariant) {
      isCurrentlyFavoriteForAction =
        wishlistData?.some(
          (item) =>
            item._id === productIdToToggle &&
            item.wishlistedVariantId === variantIdToToggle,
        ) || false;
    } else if (!product.variants || product.variants.length === 0) {
      // Sản phẩm không có variant
      isCurrentlyFavoriteForAction =
        wishlistData?.some(
          (item) => item._id === productIdToToggle && !item.wishlistedVariantId,
        ) || false;
    }
    // Nếu không có activeVariant và sản phẩm có variant, chúng ta không cho phép thêm/xóa "sản phẩm chung" ở đây
    if (isCurrentlyFavoriteForAction) {
      removeFromWishlistMutation.mutate(
        { productId: productIdToToggle, variantId: variantIdToToggle },
        { onError: (error) => console.error("Lỗi xóa khỏi wishlist:", error) },
      );
    } else {
      // Chỉ cho phép thêm nếu có activeVariant hoặc sản phẩm không có variant
      if (
        variantIdToToggle ||
        !product.variants ||
        product.variants.length === 0
      ) {
        addToWishlistMutation.mutate(
          { productId: productIdToToggle, variantId: variantIdToToggle },
          {
            onError: (error) => console.error("Lỗi thêm vào wishlist:", error),
          },
        );
      } else {
        // Trường hợp này không nên xảy ra nếu logic ở trên đúng
        console.warn(
          "Attempted to add to wishlist without variant for a product with variants.",
        );
      }
    }
  };

  const getInitialImage = useCallback(
    (variant: Variant | null = null) => {
      // Ưu tiên ảnh của variant được truyền vào (nếu có)
      if (variant?.images && variant.images.length > 0 && variant.images[0]) {
        return variant.images[0];
      }
      // Nếu không có variant hoặc variant không có ảnh, thử ảnh sản phẩm chính
      if (product.images && product.images.length > 0 && product.images[0]) {
        return product.images[0];
      }
      // Fallback nếu sản phẩm chính không có ảnh, thử ảnh của variant đầu tiên của sản phẩm
      const firstProductVariantWithImg = product.variants?.find(
        (v) => v.images && v.images.length > 0 && v.images[0],
      );
      if (firstProductVariantWithImg?.images?.[0]) {
        return firstProductVariantWithImg.images[0];
      }
      return "/placeholder-image.jpg";
    },
    [product.images, product.variants],
  );

  const [currentImage, setCurrentImage] = useState<string>(() =>
    getInitialImage(),
  );

  useEffect(() => {
    // Khi sản phẩm prop thay đổi, reset activeVariant và currentImage
    setActiveVariant(null); // Reset active variant
    setCurrentImage(getInitialImage(null)); // Lấy ảnh sản phẩm gốc khi product thay đổi
  }, [product, getInitialImage]); // getInitialImage đã có product.images, product.variants trong deps

  // Cập nhật ảnh khi activeVariant thay đổi
  useEffect(() => {
    setCurrentImage(getInitialImage(activeVariant));
  }, [activeVariant, getInitialImage]);

  const handleMouseEnterCard = () => {
    if (activeVariant?.images && activeVariant.images.length > 1) {
      // Nếu có activeVariant và nó có nhiều hơn 1 ảnh, hiển thị ảnh thứ 2 của variant
      setCurrentImage(activeVariant.images[1]);
    } else if (!activeVariant && product.images && product.images.length > 1) {
      // Nếu không có activeVariant, và sản phẩm chính có nhiều hơn 1 ảnh, hiển thị ảnh thứ 2 của sản phẩm
      setCurrentImage(product.images[1]);
    }
    // Nếu không rơi vào 2 trường hợp trên, ảnh giữ nguyên
  };

  const handleMouseLeaveCard = () => {
    // Quay về ảnh đầu tiên của activeVariant (nếu có) hoặc ảnh đầu tiên của sản phẩm
    setCurrentImage(getInitialImage(activeVariant));
  };

  const handleColorInteraction = (
    variant: Variant | null,
    interactionType: "enter" | "leave" | "click",
  ) => {
    if (interactionType === "enter") {
      // Khi hover vào một màu (chưa click), hiển thị ảnh đầu tiên của màu đó
      if (variant?.images?.[0]) {
        setCurrentImage(variant.images[0]);
      } else {
        // Nếu variant hover không có ảnh, hiển thị ảnh mặc định của sản phẩm
        setCurrentImage(getInitialImage(null)); // Lấy ảnh sản phẩm gốc
      }
    } else if (interactionType === "click") {
      setActiveVariant(variant);
      // Khi click, hiển thị ảnh đầu tiên của variant vừa được chọn
      setCurrentImage(getInitialImage(variant));
    } else if (interactionType === "leave") {
      // Khi rời chuột khỏi một màu (không phải là click)
      // Quay lại ảnh của activeVariant hiện tại (nếu có) hoặc ảnh sản phẩm gốc
      setCurrentImage(getInitialImage(activeVariant));
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
      productId: product._id,
      variantId: activeVariant?._id || null,
      quantity: 1,
    };

    addToCartMutation.mutate(cartItemData, {
      onSuccess: (updatedCartData) => {
        const addedOrUpdatedItem = updatedCartData.items.find(
          (item) =>
            item.productId === productIdToAdd &&
            (item.variantId === variantIdToAdd ||
              (!item.variantId && !variantIdToAdd)),
        );

        if (addedOrUpdatedItem) {
          // Dispatch action để thêm popup vào Redux store
          dispatch(addPopup(addedOrUpdatedItem));
        } else {
          // Fallback, có thể dispatch một popup chung chung hơn hoặc chỉ toast
          const genericItemForPopup: CartItem = {
            // Tạo một CartItem giả để hiển thị
            _id: `temp-${Date.now()}`, // ID tạm thời
            productId: product._id,
            name: product.name,
            price: displayPriceToShow, // Giá hiển thị
            quantity: 1,
            image: imageToDisplay, // Ảnh hiện tại
            slug: product.slug,
            availableStock:
              product.stockQuantity || (activeVariant?.stockQuantity ?? 0), // Cần xem lại logic stock này

            // variantInfo có thể null nếu không có activeVariant
            variantInfo: activeVariant
              ? {
                  _id: activeVariant._id, // Sử dụng _id thay vì variantId
                  options: activeVariant.optionValues.map((ov) => ({
                    attributeName: ov.attributeName,
                    value: ov.value,
                    // Nếu CartItemOption yêu cầu thêm trường, ví dụ attributeId, bạn cần thêm vào đây
                    // attributeId: ov.attributeId, (ví dụ)
                  })),
                }
              : undefined,
            sku: "",
            lineTotal: 0,
            category: {
              name: "",
              slug: "",
              _id: "",
            },
          };
          if (updatedCartData.items.length > 0) {
            // Nếu có item trong giỏ hàng, dùng item cuối cùng
            dispatch(
              addPopup(updatedCartData.items[updatedCartData.items.length - 1]),
            );
          } else {
            // Nếu giỏ hàng vẫn rỗng sau khi thêm (lạ), dùng thông tin sản phẩm hiện tại
            dispatch(addPopup(genericItemForPopup));
            // toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`); // Vẫn có thể giữ toast này
          }
        }
      },
      // onError đã được xử lý trong hook
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
            className="block aspect-[4/5] w-full overflow-hidden bg-gray-100"
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
              sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 22vw"
              className="object-cover object-center transition-transform duration-300"
              priority={false} // Đặt thành true cho các sản phẩm quan trọng ở màn hình đầu (LCP)
              onError={(e) => {
                if (e.currentTarget.src !== "/placeholder-image.jpg") {
                  e.currentTarget.src = "/placeholder-image.jpg";
                }
              }}
            />
          </Link>
          {/* Bangers */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start space-y-1.5 sm:top-3 sm:left-3">
            {product.isNew && (
              <span className="rounded-md bg-green-100 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-green-700 uppercase sm:text-xs">
                Mới
              </span>
            )}
            {isOnSaleToShow && percentageDiscount > 0 && (
              <span className="rounded-md bg-red-100 px-2.5 py-1 text-[10px] font-semibold text-red-700 sm:text-xs">
                -{percentageDiscount}%
              </span>
            )}
            {product.totalSold != null &&
              product.totalSold > 30 &&
              !product.isNew && (
                <span className="rounded-md bg-orange-100 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-orange-700 uppercase sm:text-xs">
                  Bán Chạy
                </span>
              )}
          </div>
          {/* Action buttons */}
          <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end space-y-2 sm:top-3 sm:right-3">
            {/* Nút Yêu thích - Luôn hiển thị */}
            <button
              onClick={handleToggleWishlist}
              disabled={isLoadingWishlist || isWishlistActionPending}
              title={
                // Title sẽ phức tạp hơn một chút
                activeVariant && isFavorite
                  ? "Xóa phiên bản này khỏi Yêu thích"
                  : !activeVariant &&
                      isFavorite &&
                      product.variants &&
                      product.variants.length > 0
                    ? "Một phiên bản được yêu thích"
                    : isFavorite
                      ? "Xóa khỏi Yêu thích"
                      : product.variants &&
                          product.variants.length > 0 &&
                          !activeVariant
                        ? "Chọn phiên bản để yêu thích"
                        : "Thêm vào Yêu thích"
              }
              className={classNames(
                "flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-9 sm:w-9",
                {
                  "text-red-500 hover:bg-red-500 hover:text-white focus-visible:ring-red-500":
                    isFavorite,
                  "text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400":
                    !isFavorite,
                  "cursor-not-allowed opacity-60":
                    isLoadingWishlist || isWishlistActionPending,
                },
              )}
              aria-label={
                isFavorite ? "Quản lý Yêu thích" : "Thêm vào Yêu thích"
              }
            >
              {isWishlistActionPending ? (
                <FiLoader className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
              ) : (
                <FiHeart
                  className={classNames("h-4 w-4 sm:h-5 sm:w-5", {
                    "fill-current": isFavorite, // Icon fill dựa trên isFavorite tổng hợp
                  })}
                />
              )}
            </button>

            {/* Nút Thêm vào giỏ hàng - Hiển thị khi hover card (trên desktop) */}
            <button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
              title="Thêm vào giỏ hàng"
              className={classNames(
                "flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-indigo-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:h-9 sm:w-9",
                "opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100", // Mặc định ẩn, hiện khi hover group (card) trên mọi kích thước, nhưng có thể làm phức tạp hơn cho mobile
                // Để đơn giản cho mobile, có thể bỏ opacity-0 ở đây và dựa vào nút "Thêm vào giỏ" bên dưới
                // Hoặc chỉ ẩn trên mobile: "hidden group-hover:flex lg:flex" (cần điều chỉnh)
                {
                  "cursor-not-allowed opacity-60": addToCartMutation.isPending,
                },
              )}
              aria-label="Thêm vào giỏ hàng"
            >
              {addToCartMutation.isPending ? (
                <FiLoader className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
              ) : (
                <FiShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-grow flex-col p-3 sm:p-4">
          {uniqueColorVariants.length > 0 && (
            <div className="mb-2.5 flex h-auto min-h-[28px] flex-wrap items-center gap-x-1.5 gap-y-1">
              {" "}
              {/* Thêm gap-y-1 cho trường hợp wrap */}
              {uniqueColorVariants
                .slice(0, MAX_VISIBLE_COLORS)
                .map((variant) => {
                  const colorOpt = variant.optionValues.find(
                    (opt) => opt.attributeName === colorAttributeName,
                  );
                  if (!colorOpt || !colorOpt.value) return null;

                  const colorValue = colorOpt.value.toLowerCase().trim();
                  let colorHex = "#E2E8F0";
                  // Ưu tiên khớp chính xác trước, sau đó là khớp một phần
                  const colorMappings: { [key: string]: string } = {
                    // Đen & Xám
                    đen: "#000000", // Black
                    "đen xám": "#2D3748", // Dark Gray (gần black)
                    "xám đậm": "#4A5568", // Gray-700
                    xám: "#A0AEC0", // Gray-400
                    "xám nhạt": "#CBD5E0", // Gray-300
                    ghi: "#A0AEC0", // Đồng nghĩa với xám
                    than: "#36454F", // Charcoal

                    // Trắng & Be
                    trắng: "#FFFFFF",
                    kem: "#FFFDD0", // Cream
                    be: "#F5F5DC", // Beige
                    ngà: "#FFFFF0", // Ivory
                    "vàng kem": "#F0E68C", // Khaki

                    // Xanh dương
                    "xanh navy": "#2C5282",
                    "xanh dương đậm": "#2B6CB0",
                    "xanh dương": "#4299E1",
                    "xanh da trời": "#63B3ED",
                    "xanh dương nhạt": "#BEE3F8",
                    "xanh coban": "#0047AB",
                    "xanh lam": "#4299E1",
                    "xanh biển": "#0077BE",

                    // Xanh lá
                    "xanh lá đậm": "#2F855A",
                    "xanh lá cây": "#48BB78",
                    "xanh lá": "#48BB78",
                    "xanh rêu": "#556B2F",
                    "xanh bạc hà": "#98FF98",
                    "xanh olive": "#808000",
                    "xanh lá mạ": "#C1FFC1",
                    "xanh ngọc": "#AFEEEE",
                    "xanh cổ vịt": "#008080",

                    // Đỏ
                    "đỏ tươi": "#FF0000",
                    đỏ: "#E53E3E",
                    "đỏ đô": "#8B0000",
                    "đỏ cam": "#FF4500",
                    "đỏ gạch": "#B22222",
                    "đỏ rượu": "#722F37",

                    // Hồng
                    "hồng đậm": "#DB2777",
                    "hồng cánh sen": "#FF69B4",
                    "hồng phấn": "#FFD1DC",
                    hồng: "#FBB6CE",
                    "hồng đất": "#E75480",
                    "hồng cam": "#FFB3A7",

                    // Vàng
                    "vàng tươi": "#FFFF00",
                    vàng: "#ECC94B",
                    "vàng đậm": "#D69E2E",
                    "vàng nghệ": "#FFBF00",
                    "vàng chanh": "#FFFACD",
                    "vàng đồng": "#B87333",
                    "vàng bò": "#DAA520",

                    // Cam
                    "cam đậm": "#DD6B20",
                    cam: "#F59E0B",
                    "cam đất": "#CC5500",
                    "cam nhạt": "#FED7AA",

                    // Tím
                    tím: "#805AD5",
                    "tím đậm": "#6B46C1",
                    "tím than": "#581C87",
                    "tím nhạt": "#D6BCFA",
                    "tím lavender": "#E6E6FA",
                    "tím cà": "#6A0DAD",

                    // Nâu
                    nâu: "#A16207",
                    "nâu đậm": "#7B341E",
                    "nâu nhạt": "#D69E2E",
                    "nâu đất": "#A0522D",
                    "nâu cà phê": "#4A2C2A",
                    "nâu socola": "#7B3F00",

                    // Kim loại & đặc biệt
                    bạc: "#C0C0C0",
                    "vàng gold": "#FFD700",
                    đồng: "#B87333",
                    "đa sắc":
                      "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
                    "họa tiết": "#CCCCCC", // Placeholder màu họa tiết
                  };

                  if (colorMappings[colorValue]) {
                    colorHex = colorMappings[colorValue];
                  } else {
                    for (const key in colorMappings) {
                      if (colorValue.includes(key)) {
                        colorHex = colorMappings[key];
                        break;
                      }
                    }
                  }
                  const isCurrentlyActive = activeVariant?._id === variant._id;
                  return (
                    <button
                      type="button"
                      key={variant._id}
                      title={colorOpt.value}
                      onMouseEnter={() =>
                        handleColorInteraction(variant, "enter")
                      }
                      onMouseLeave={() => handleColorInteraction(null, "leave")}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleColorInteraction(variant, "click");
                      }}
                      // Tăng kích thước color swatch
                      className={classNames(
                        "h-5 w-5 flex-shrink-0 cursor-pointer rounded-full border shadow-sm transition-all duration-150 focus:outline-none sm:h-6 sm:w-6", // Kích thước nhỏ hơn một chút
                        isCurrentlyActive
                          ? "scale-110 border-2 border-slate-700 ring-1 ring-slate-700 ring-offset-1" // Active state rõ ràng hơn
                          : "border-gray-300 hover:border-gray-500", // Hover đậm hơn
                        {
                          "border-black":
                            (colorHex === "#FFFFFF" ||
                              colorHex === "#FFFFF0" ||
                              colorHex === "#FFFDD0") &&
                            !isCurrentlyActive,
                        },
                      )}
                      style={{
                        ...(colorHex.startsWith("linear-gradient")
                          ? { background: colorHex }
                          : { backgroundColor: colorHex }),
                      }}
                      aria-label={`Chọn màu ${colorOpt.value}`}
                    />
                  );
                })}
              {uniqueColorVariants.length > MAX_VISIBLE_COLORS && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-xs font-medium text-gray-600 sm:h-6 sm:w-6">
                  +{uniqueColorVariants.length - MAX_VISIBLE_COLORS}
                </div>
              )}
            </div>
          )}
          <h3 className="line-clamp-2 text-sm font-medium text-gray-800 transition-colors group-hover:text-indigo-600 sm:text-base">
            <Link
              href={`/products/${product.slug}${activeVariant ? `?variant=${activeVariant._id}` : ""}`}
            >
              {product.name}
            </Link>
          </h3>
          <div className="mt-auto pt-2">
            {" "}
            {/* Đẩy giá xuống dưới cùng của flex-grow */}
            <div className="flex flex-wrap items-baseline justify-start">
              <span className="mr-2 text-base font-bold text-gray-900 sm:text-lg">
                {formatCurrency(displayPriceToShow)}
              </span>
              {isOnSaleToShow && originalPriceToShow > displayPriceToShow && (
                <>
                  <span className="text-xs text-gray-500 line-through sm:text-sm">
                    {formatCurrency(originalPriceToShow)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
