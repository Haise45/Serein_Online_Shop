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
  const dispatch: AppDispatch = useDispatch(); // Khởi tạo dispatch
  const addToCartMutation = useAddToCart();

  const { data: wishlistData, isLoading: isLoadingWishlist } = useGetWishlist();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  const [activeVariant, setActiveVariant] = useState<Variant | null>(null);

  const isFavorite = useMemo(() => {
    if (!wishlistData) return false;
    return wishlistData.some(
      (item) =>
        item._id === product._id &&
        ((activeVariant && item.wishlistedVariantId === activeVariant._id) ||
          (!activeVariant &&
            !item.wishlistedVariantId &&
            product.variants &&
            product.variants.length === 0) || // Thích sản phẩm không có variant
          (!activeVariant &&
            product.variants &&
            product.variants.length > 0 &&
            !item.wishlistedVariantId)), // Trường hợp đặc biệt: thích sản phẩm chung có variant (ít phổ biến)
    );
  }, [wishlistData, product._id, product.variants, activeVariant]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      addToWishlistMutation.isPending ||
      removeFromWishlistMutation.isPending
    ) {
      return;
    }

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

    const productIdToToggle = product._id;
    const variantIdToToggle = activeVariant?._id || null;

    if (isFavorite) {
      // Khi xóa, chúng ta cần gửi productId và variantId (nếu có) của item đang được hiển thị là favorite
      removeFromWishlistMutation.mutate(
        { productId: productIdToToggle, variantId: variantIdToToggle }, // Gửi cả variantId nếu đang active
        {
          onError: (error) => {
            console.error("Lỗi xóa khỏi wishlist trên card:", error);
          },
        },
      );
    } else {
      addToWishlistMutation.mutate(
        { productId: productIdToToggle, variantId: variantIdToToggle },
        {
          onError: (error) => {
            console.error("Lỗi thêm vào wishlist trên card:", error);
          },
        },
      );
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
            className="block aspect-[4/5] w-full overflow-hidden bg-gray-100 sm:aspect-[9/10]"
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
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover object-center transition-transform duration-300 ease-in-out"
              priority={false} // Đặt thành true cho các sản phẩm quan trọng ở màn hình đầu (LCP)
              onError={(e) => {
                if (e.currentTarget.src !== "/placeholder-image.jpg") {
                  e.currentTarget.src = "/placeholder-image.jpg";
                }
              }}
            />
          </Link>
          <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end space-y-1.5 sm:top-3 sm:right-3">
            {product.isNew && (
              <span className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold tracking-wider text-green-700 uppercase sm:text-sm">
                Mới
              </span>
            )}
            {isOnSaleToShow && percentageDiscount > 0 && (
              <span className="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 sm:text-sm">
                -{percentageDiscount}%
              </span>
            )}
            {product.totalSold != null &&
              product.totalSold > 30 &&
              !product.isNew && (
                <span className="rounded-md bg-orange-100 px-2.5 py-1 text-xs font-semibold tracking-wider text-orange-700 uppercase sm:text-sm">
                  Bán Chạy
                </span>
              )}
          </div>
          {/* Action buttons */}
          <div className="absolute right-0 bottom-0 left-0 z-10 hidden translate-y-full justify-center space-x-3 bg-gradient-to-t from-black/15 via-black/10 to-transparent pt-10 pb-4 opacity-0 transition-all duration-300 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
            <button
              onClick={handleToggleWishlist}
              disabled={isLoadingWishlist || isWishlistActionPending}
              title={isFavorite ? "Xóa khỏi Yêu thích" : "Thêm vào Yêu thích"}
              className={classNames(
                "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:h-11 sm:w-11",
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
                <FiLoader className="h-5 w-5 animate-spin sm:h-6 sm:w-6" />
              ) : (
                // Icon fill dựa trên isFavorite, không còn phụ thuộc canAddToWishlist
                <FiHeart
                  className={classNames("h-5 w-5 sm:h-6 sm:w-6", {
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
                "flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-indigo-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:h-11 sm:w-11", // Tăng kích thước button trên sm+
                {
                  "cursor-not-allowed opacity-70": addToCartMutation.isPending,
                },
              )}
              aria-label="Thêm vào giỏ hàng"
            >
              {addToCartMutation.isPending ? (
                <FiLoader className="h-5 w-5 animate-spin sm:h-6 sm:w-6" />
              ) : (
                <FiShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" /> // Tăng kích thước icon
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-grow flex-col p-3 pt-4 sm:p-4 sm:pt-5">
          {uniqueColorVariants.length > 0 && (
            <div className="mb-3 flex h-8 items-center space-x-1.5 pb-1">
              {uniqueColorVariants.map((variant) => {
                const colorOpt = variant.optionValues.find(
                  (opt) => opt.attributeName === colorAttributeName,
                );
                if (!colorOpt || !colorOpt.value) return null;

                const colorValue = colorOpt.value.toLowerCase().trim();
                let colorHex = "#E2E8F0";
                // Ưu tiên khớp chính xác trước, sau đó là khớp một phần
                const colorMappings: { [key: string]: string } = {
                  // Đen & Xám
                  đen: "#2D3748", // Black (gray-800)
                  "xám đậm": "#4A5568", // Gray-700
                  xám: "#A0AEC0", // Gray-500
                  "xám nhạt": "#CBD5E0", // Gray-400
                  ghi: "#A0AEC0", // Đồng nghĩa với xám
                  than: "#36454F", // Charcoal

                  // Trắng & Be
                  trắng: "#FFFFFF", // White
                  kem: "#FFFDD0", // Cream
                  be: "#F5F5DC", // Beige
                  ngà: "#FFFFF0", // Ivory
                  "vàng kem": "#F0E68C", // Khaki (có thể coi là một loại be/kem)

                  // Xanh dương (Blue)
                  "xanh navy": "#2c5282", // Navy (blue-800)
                  "xanh dương đậm": "#2b6cb0", // Blue-700
                  "xanh dương": "#4299e1", // Blue-500
                  "xanh da trời": "#63B3ED", // Sky Blue (blue-400)
                  "xanh dương nhạt": "#BEE3F8", // Light Blue (blue-200)
                  "xanh coban": "#0047AB", // Cobalt Blue
                  "xanh lam": "#4299e1", // Đồng nghĩa với xanh dương
                  "xanh biển": "#0077BE", // Sea Blue

                  // Xanh lá (Green)
                  "xanh lá đậm": "#2F855A", // Green-700
                  "xanh lá cây": "#48BB78", // Green-500
                  "xanh lá": "#48BB78", // Đồng nghĩa
                  "xanh rêu": "#8FBC8F", // Dark Sea Green / Moss Green
                  "xanh bạc hà": "#98FF98", // Mint Green
                  "xanh olive": "#808000", // Olive
                  "xanh lá mạ": "#C1FFC1", // Lime Green (nhạt)
                  "xanh ngọc": "#AFEEEE", // PaleTurquoise (có thể coi là xanh ngọc nhạt)
                  "xanh cổ vịt": "#008080", // Teal

                  // Đỏ
                  "đỏ đô": "#8B0000", // Dark Red / Maroon
                  "đỏ tươi": "#FF0000", // Red
                  đỏ: "#E53E3E", // Red-600 (Tailwind)
                  "đỏ cam": "#FF4500", // OrangeRed
                  "đỏ gạch": "#B22222", // Firebrick
                  "đỏ rượu": "#722F37", // Wine Red

                  // Hồng
                  "hồng đậm": "#DB2777", // Pink-600 (Tailwind)
                  "hồng cánh sen": "#FF69B4", // Hot Pink
                  "hồng phấn": "#FFD1DC", // Pink (light)
                  hồng: "#FBB6CE", // Pink-300 (Tailwind)
                  "hồng đất": "#E75480", // Dark Pink (có thể gần hồng đất)
                  "hồng cam": "#FFB3A7", // Light Salmon / Pink-Orange

                  // Vàng
                  "vàng đậm": "#D69E2E", // Yellow-600 (Tailwind)
                  "vàng tươi": "#FFFF00", // Yellow
                  vàng: "#ECC94B", // Yellow-500 (Tailwind)
                  "vàng nghệ": "#FFBF00", // Amber / Turmeric Yellow
                  "vàng chanh": "#FFFACD", // LemonChiffon (vàng nhạt)
                  "vàng đồng": "#B87333", // Copper (có thể coi là vàng đồng)
                  "vàng bò": "#DAA520", // Goldenrod (có thể coi là vàng bò)

                  // Cam
                  "cam đậm": "#DD6B20", // Orange-600 (Tailwind)
                  cam: "#F59E0B", // Orange-500 (Tailwind)
                  "cam đất": "#CC5500", // Burnt Orange
                  "cam nhạt": "#FED7AA", // Orange-200 (Tailwind)

                  // Tím
                  "tím đậm": "#6B46C1", // Purple-700 (Tailwind)
                  tím: "#805AD5", // Purple-600 (Tailwind)
                  "tím than": "#581C87", // Purple-900 (Tailwind, gần giống tím than)
                  "tím nhạt": "#D6BCFA", // Purple-300 (Tailwind)
                  "tím lavender": "#E6E6FA", // Lavender
                  "tím cà": "#6A0DAD", // Purple (chuẩn)

                  // Nâu
                  "nâu đậm": "#7B341E", // Amber-900 (gần nâu đậm) / Brown-700
                  nâu: "#A16207", // Amber-700 (gần nâu) / Brown-500
                  "nâu nhạt": "#D69E2E", // Amber-600 (gần nâu nhạt) / Brown-300
                  "nâu đất": "#A0522D", // Sienna (nâu đất)
                  "nâu cà phê": "#4A2C2A", // Dark Brown (coffee)
                  "nâu socola": "#7B3F00", // Chocolate

                  // Kim loại & Đặc biệt
                  bạc: "#C0C0C0", // Silver
                  "vàng gold": "#FFD700", // Gold
                  đồng: "#B87333", // Copper
                  "đa sắc":
                    "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)", // Ví dụ cho đa sắc
                  "họa tiết": "#CCCCCC", // Placeholder cho họa tiết, có thể hiển thị xám
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
                      "h-6 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 shadow-sm transition-all duration-150 focus:outline-none sm:h-7 sm:w-7",
                      isCurrentlyActive
                        ? "scale-110 border-indigo-500 ring-2 ring-indigo-500 ring-offset-1" // Tăng ring
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
            </div>
          )}
          {/* Tăng kích thước chữ và min-height cho tên sản phẩm */}
          <h3 className="line-clamp-2 min-h-[3em] flex-grow text-base font-medium text-gray-800 transition-colors group-hover:text-indigo-600 sm:min-h-[3.25em] sm:text-lg">
            <Link
              href={`/products/${product.slug}${activeVariant ? `?variant=${activeVariant._id}` : ""}`}
            >
              {product.name}
            </Link>
          </h3>
          {/* Tăng kích thước chữ cho giá */}
          <div className="mt-2.5 flex flex-wrap items-baseline justify-start sm:mt-3">
            <span className="mr-2 text-base font-bold text-indigo-600 sm:text-xl">
              {formatCurrency(displayPriceToShow)}
            </span>
            {isOnSaleToShow && originalPriceToShow > displayPriceToShow && (
              <span className="text-sm text-gray-500 line-through sm:text-base">
                {formatCurrency(originalPriceToShow)}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
