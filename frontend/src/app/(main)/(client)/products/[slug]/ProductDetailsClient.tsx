"use client";

import AttributeSelector from "@/components/client/product/AttributeSelector";
import ImageGallery from "@/components/client/product/ImageGallery";
import ProductDescriptionAndReviews, {
  ProductReviewsRef,
} from "@/components/client/product/ProductDescriptionAndReviews";
import RatingStars from "@/components/shared/RatingStars";
import { useAddToCart } from "@/lib/react-query/cartQueries";
import { useGetProductDetails } from "@/lib/react-query/productQueries";
import {
  useAddToWishlist,
  useGetWishlist,
  useRemoveFromWishlist,
} from "@/lib/react-query/wishlistQueries";
import { formatCurrency } from "@/lib/utils";
import { AppDispatch } from "@/store";
import { addPopup } from "@/store/slices/notificationPopupSlice";
import { Variant } from "@/types/product";
import classNames from "classnames";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiHeart,
  FiInfo,
  FiLoader,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiTag,
  FiTrendingUp,
} from "react-icons/fi";
import { useDispatch } from "react-redux";

interface ProductDetailsClientProps {
  slug: string;
}

export default function ProductDetailsClient({
  slug,
}: ProductDetailsClientProps) {
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useGetProductDetails(slug);
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();

  const reviewsSectionRef = useRef<ProductReviewsRef>(null);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | null>
  >({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const addToCartMutation = useAddToCart();
  const { data: wishlistData } = useGetWishlist();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  // Effect để khởi tạo/đồng bộ selectedOptions và selectedVariant khi product hoặc variantId từ URL thay đổi
  useEffect(() => {
    if (product) {
      const variantIdFromUrl = searchParams.get("variant");
      const initialOptions: Record<string, string | null> = {};
      let initialVariant: Variant | null = null;

      if (variantIdFromUrl && product.variants && product.variants.length > 0) {
        const variantFromUrl = product.variants.find(
          (v) => v._id === variantIdFromUrl,
        );
        if (variantFromUrl) {
          initialVariant = variantFromUrl;
          // Thiết lập selectedOptions dựa trên variant từ URL
          variantFromUrl.optionValues.forEach((ov) => {
            initialOptions[ov.attributeName] = ov.value;
          });
        } else {
          // Nếu variantId từ URL không hợp lệ, không chọn gì cả
          console.warn(
            `Variant ID "${variantIdFromUrl}" từ URL không tìm thấy trong sản phẩm.`,
          );
          product.attributes?.forEach((attr) => {
            initialOptions[attr.name] = null;
          });
        }
      } else {
        // Nếu không có variantId từ URL, không chọn gì cả ban đầu
        product.attributes?.forEach((attr) => {
          initialOptions[attr.name] = null;
        });
      }

      setSelectedOptions(initialOptions);
      setSelectedVariant(initialVariant);
      setQuantity(1); // Reset quantity khi product/variant load
    }
  }, [product, searchParams]); // Thêm searchParams vào dependencies

  useEffect(() => {
    if (product && product.variants && product.attributes) {
      // Kiểm tra xem TẤT CẢ các thuộc tính (attributes) có giá trị được chọn không rỗng (khác null) không
      const allRequiredAttributesSelected = product.attributes.every(
        (attr) =>
          selectedOptions[attr.name] !== null &&
          selectedOptions[attr.name] !== undefined,
      );

      if (allRequiredAttributesSelected) {
        const foundVariant = product.variants.find((variant) =>
          variant.optionValues.every(
            (ov) => selectedOptions[ov.attributeName] === ov.value,
          ),
        );
        // Chỉ cập nhật selectedVariant nếu nó khác với variant hiện tại
        // để tránh vòng lặp nếu effect trên cũng đang set selectedVariant
        if (foundVariant?._id !== selectedVariant?._id) {
          // So sánh bằng id để chắc chắn
          setSelectedVariant(foundVariant || null);
          if (foundVariant) setQuantity(1);
        } else if (!foundVariant && selectedVariant !== null) {
          // Trường hợp tổ hợp options không tạo ra variant nào, reset selectedVariant
          setSelectedVariant(null);
        }
      } else if (selectedVariant !== null) {
        // Nếu không phải tất cả option được chọn, nhưng trước đó đã có selectedVariant, reset nó
        setSelectedVariant(null);
      }
    }
  }, [product, selectedOptions, selectedVariant]);

  const handleScrollToReviews = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    reviewsSectionRef.current?.focusReviewsTab(); // Gọi hàm từ component con
  };

  const handleOptionSelect = (attributeName: string, value: string | null) => {
    setSelectedOptions((prev) => {
      const newOptions = { ...prev, [attributeName]: value };
      // Khi một lựa chọn thay đổi, chúng ta cần xác định lại các lựa chọn khả dụng cho các thuộc tính khác.
      return newOptions;
    });
  };

  // --- Logic xác định khi nào tất cả các option bắt buộc đã được chọn ---
  const allRequiredOptionsSelected = useMemo(() => {
    if (!product || !product.attributes || product.attributes.length === 0) {
      return true; // Nếu không có attributes, coi như đã chọn xong (cho sản phẩm không có variant)
    }
    return product.attributes.every(
      (attr) =>
        selectedOptions[attr.name] !== null &&
        selectedOptions[attr.name] !== undefined,
    );
  }, [product, selectedOptions]);

  // --- Thông tin tồn kho chỉ hiển thị khi đã chọn xong variant (hoặc sản phẩm không có variant) ---
  const stockToDisplay = useMemo(() => {
    if (product && product.variants && product.variants.length > 0) {
      // Nếu sản phẩm có variant, chỉ hiển thị stock khi một variant cụ thể được chọn
      return selectedVariant?.stockQuantity ?? 0; // Trả về 0 nếu chưa chọn variant
    }
    // Nếu sản phẩm không có variant, hiển thị stock của sản phẩm chính
    return product?.stockQuantity ?? 0;
  }, [product, selectedVariant]);

  const showStockInfo = useMemo(() => {
    if (product && product.variants && product.variants.length > 0) {
      // Nếu có variant, chỉ hiển thị stock khi selectedVariant có giá trị (đã chọn đủ options)
      return !!selectedVariant;
    }
    return true; // Luôn hiển thị stock nếu sản phẩm không có variant
  }, [product, selectedVariant]);

  // Hàm tính toán các options bị disable cho một thuộc tính cụ thể
  const getDisabledOptionsForAttribute = useCallback(
    (attributeName: string): Set<string> => {
      if (!product || !product.variants || !product.attributes) {
        return new Set<string>();
      }

      const disabled = new Set<string>();
      const currentAttribute = product.attributes.find(
        (attr) => attr.name === attributeName,
      );
      if (!currentAttribute) return disabled;

      // Lặp qua từng giá trị có thể có của thuộc tính hiện tại
      currentAttribute.values.forEach((potentialValue) => {
        // Tạo một bản sao các lựa chọn hiện tại và thử đặt giá trị này cho thuộc tính đang xét
        const tempSelectedOptions = {
          ...selectedOptions,
          [attributeName]: potentialValue,
        };

        // Kiểm tra xem có variant nào tồn tại với tổ hợp lựa chọn tạm thời này không
        const hasMatchingVariant = product.variants.some((variant) => {
          // Variant này phải khớp với TẤT CẢ các lựa chọn đã có trong tempSelectedOptions (bao gồm cả potentialValue)
          // NGOẠI TRỪ những lựa chọn đang là null (chưa được chọn)
          return product.attributes.every((attr) => {
            const selectedVal = tempSelectedOptions[attr.name];
            if (selectedVal === null || selectedVal === undefined) return true; // Bỏ qua nếu thuộc tính đó chưa được chọn trong temp
            return variant.optionValues.some(
              (ov) =>
                ov.attributeName === attr.name && ov.value === selectedVal,
            );
          });
        });

        if (!hasMatchingVariant) {
          disabled.add(potentialValue);
        }
      });
      return disabled;
    },
    [product, selectedOptions],
  );

  const imagesToDisplay = useMemo(() => {
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    if (selectedOptions["Màu sắc"] && product?.variants) {
      const colorMatchedVariant = product.variants.find(
        (v) =>
          v.optionValues.some(
            (opt) =>
              opt.attributeName === "Màu sắc" &&
              opt.value === selectedOptions["Màu sắc"],
          ) &&
          v.images &&
          v.images.length > 0,
      );
      if (colorMatchedVariant?.images?.length) {
        return colorMatchedVariant.images;
      }
    }
    return product?.images || [];
  }, [product, selectedVariant, selectedOptions]);

  const handleQuantityChange = (amount: number) => {
    setQuantity((prev) => Math.max(1, Math.min(prev + amount, stockToDisplay)));
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants.length > 0 && !selectedVariant) {
      toast.error(
        "Vui lòng chọn đầy đủ các phiên bản (màu sắc, kích thước...).",
      );
      return;
    }
    if (stockToDisplay <= 0) {
      toast.error("Sản phẩm này đã hết hàng.");
      return;
    }
    addToCartMutation.mutate(
      { productId: product._id, variantId: selectedVariant?._id, quantity },
      {
        onSuccess: (cart) => {
          const itemAdded = cart.items.find(
            (i) =>
              i.productId === product._id &&
              (selectedVariant
                ? i.variantInfo?._id === selectedVariant._id
                : !i.variantInfo),
          );
          if (itemAdded) dispatch(addPopup(itemAdded));
          else toast.success(`${product.name} đã được thêm vào giỏ!`);
        },
      },
    );
  };

  const isFavorite = useMemo(() => {
    if (!wishlistData || !product) return false;
    return wishlistData.some(
      (item) =>
        item._id === product._id &&
        item.wishlistedVariantId ===
          (product.variants.length > 0 && selectedVariant
            ? selectedVariant._id
            : null),
    );
  }, [wishlistData, product, selectedVariant]);

  const handleToggleWishlist = () => {
    if (!product) return;
    if (product.variants.length > 0 && !selectedVariant) {
      toast.error("Vui lòng chọn phiên bản để thêm vào yêu thích.");
      return;
    }
    const payload = {
      productId: product._id,
      variantId: selectedVariant?._id || null,
    };
    if (isFavorite) removeFromWishlistMutation.mutate(payload);
    else addToWishlistMutation.mutate(payload);
  };

  const nameToDisplay = product?.name || "Đang tải...";
  const priceToDisplay = selectedVariant?.price ?? product?.price ?? 0;
  const displayPriceFinal =
    selectedVariant?.displayPrice ?? product?.displayPrice ?? 0;
  const isOnSaleFinal = selectedVariant?.isOnSale ?? product?.isOnSale ?? false;
  const skuToDisplay = selectedVariant?.sku ?? product?.sku ?? "N/A";
  const totalSoldDisplay = product?.totalSold ?? 0;
  const percentageDiscount =
    isOnSaleFinal && priceToDisplay > displayPriceFinal
      ? Math.round(
          ((priceToDisplay - displayPriceFinal) / priceToDisplay) * 100,
        )
      : 0;

  if (isLoading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <FiLoader className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="ml-3 text-lg text-gray-600">Đang tải sản phẩm...</p>
      </div>
    );

  if (isError || !product)
    return (
      <div className="p-4 py-10 text-center">
        <FiAlertCircle className="mx-auto h-16 w-16 text-red-500" />
        <p className="mt-4 text-xl font-semibold text-red-700">
          Lỗi không tải được sản phẩm
        </p>
        <p className="text-gray-600">
          {error instanceof Error
            ? error.message
            : "Có lỗi xảy ra, vui lòng thử lại."}
        </p>
      </div>
    );

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="p-4 sm:p-6 md:p-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8 xl:gap-x-12">
          {/* Image Gallery */}
          <div className="lg:col-span-7 xl:col-span-7">
            <ImageGallery
              images={
                imagesToDisplay.length > 0
                  ? imagesToDisplay
                  : product?.images?.length
                    ? product.images
                    : ["/placeholder-image.jpg"]
              }
              productName={product.name}
              className="w-full"
            />
          </div>

          {/* Product Info */}
          <div className="mt-8 lg:col-span-5 lg:mt-0 xl:col-span-5">
            <div className="flex flex-col space-y-4">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                {nameToDisplay}
              </h1>
              <div className="mt-2">
                {/* ... Price section ... */}
                <p className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  {formatCurrency(displayPriceFinal)}
                  {isOnSaleFinal && percentageDiscount > 0 && (
                    <span className="ml-2 text-base font-medium text-red-500">
                      (-{percentageDiscount}%)
                    </span>
                  )}
                </p>
                {isOnSaleFinal && priceToDisplay > displayPriceFinal && (
                  <p className="mt-1 text-lg text-gray-500 line-through">
                    {formatCurrency(priceToDisplay)}
                  </p>
                )}
              </div>
              <div className="mt-3 border-t border-gray-200 pt-4">
                {/* ... Reviews section ... */}
                <div className="flex items-center">
                  <RatingStars rating={product.averageRating} size="md" />
                  {product.numReviews > 0 ? (
                    <a
                      href="#reviews-section"
                      onClick={handleScrollToReviews}
                      className="ml-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {product.numReviews} đánh giá
                    </a>
                  ) : (
                    <p className="ml-3 text-sm text-gray-500">
                      Chưa có đánh giá
                    </p>
                  )}
                </div>
                {/* SKU hiển thị có điều kiện */}
                <div className="mt-3">
                  <p className="flex items-center text-sm text-gray-600">
                    <FiTag className="mr-2 h-4 w-4 text-gray-400" />
                    SKU:{" "}
                    <span className="ml-1 font-medium text-gray-800">
                      {skuToDisplay}
                    </span>
                  </p>
                </div>

                <div className="mt-1 space-y-1.5 text-sm text-gray-600">
                  {/* ... Đã bán, Danh mục ... */}
                  <p className="flex items-center">
                    <FiTrendingUp className="mr-2 h-4 w-4 text-gray-400" />
                    Đã bán:{" "}
                    <span className="ml-1 font-medium text-gray-800">
                      {totalSoldDisplay}
                    </span>
                  </p>
                  {product.category && typeof product.category !== "string" && (
                    <p className="flex items-center">
                      {" "}
                      <FiInfo className="mr-2 h-4 w-4 text-gray-400" /> Danh
                      mục:{" "}
                      <Link
                        href={`/products?category=${product.category.slug}`}
                        className="ml-1 text-indigo-600 hover:underline"
                      >
                        {product.category.name}
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <form className="mt-6">
              {product.attributes && product.attributes.length > 0 && (
                <div className="space-y-6 border-t border-gray-200 pt-6">
                  {product.attributes.map((attr) => (
                    <AttributeSelector
                      key={attr.name}
                      attribute={attr}
                      selectedValue={selectedOptions[attr.name]}
                      onSelectValue={handleOptionSelect}
                      type={
                        attr.name.toLowerCase().includes("màu")
                          ? "color"
                          : "text"
                      }
                      disabledOptions={getDisabledOptionsForAttribute(
                        attr.name,
                      )} // Giữ nguyên
                      isGroupDisabled={isLoading}
                    />
                  ))}
                </div>
              )}

              {/* Quantity - Chỉ hiển thị khi đã chọn đủ variant hoặc sản phẩm không có variant */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-gray-900">
                    Số lượng
                  </h3>
                  {showStockInfo && (
                    <p className="text-sm font-medium text-gray-500">
                      {stockToDisplay > 0 ? (
                        `Còn lại: ${stockToDisplay}`
                      ) : (
                        <span className="font-semibold text-red-600">
                          Hết hàng
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-2 inline-flex items-center overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className={`flex items-center justify-center bg-white px-3 py-2 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40`}
                  title="Giảm số lượng"
                >
                  <FiMinus className="h-5 w-5 text-gray-600" />
                </button>

                <input
                  type="text"
                  value={quantity}
                  readOnly
                  className="w-12 border-x border-gray-200 bg-white text-center text-base font-medium text-gray-800 focus:outline-none"
                  aria-label="Số lượng sản phẩm"
                />

                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= stockToDisplay || stockToDisplay === 0}
                  className={`flex items-center justify-center bg-white px-3 py-2 transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40`}
                  title="Tăng số lượng"
                >
                  <FiPlus className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
                {/* ... Nút "Thêm vào giỏ" và "Yêu thích" ... */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                    addToCartMutation.isPending ||
                    !showStockInfo ||
                    stockToDisplay === 0 ||
                    (product.variants.length > 0 && !selectedVariant)
                  }
                  className="flex w-full flex-1 items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition-colors duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {addToCartMutation.isPending ? (
                    <FiLoader className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <FiShoppingCart className="mr-2 h-5 w-5" />
                  )}
                  Thêm vào giỏ
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={
                    addToWishlistMutation.isPending ||
                    removeFromWishlistMutation.isPending ||
                    (product.variants.length > 0 && !selectedVariant)
                  }
                  className={classNames(
                    "flex w-full items-center justify-center rounded-lg border px-6 py-3.5 text-base font-semibold shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none sm:w-auto",
                    isFavorite
                      ? "border-red-500 bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500",
                    {
                      "cursor-not-allowed opacity-60":
                        (product.variants.length > 0 && !selectedVariant) ||
                        addToWishlistMutation.isPending ||
                        removeFromWishlistMutation.isPending,
                    },
                  )}
                  aria-label={
                    isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"
                  }
                >
                  <FiHeart
                    className={classNames("h-5 w-5", {
                      "fill-current": isFavorite,
                    })}
                  />
                </button>
              </div>
              {/* Thông báo nếu chưa chọn đủ variant */}
              {product.variants.length > 0 && !allRequiredOptionsSelected && (
                <p className="mt-3 text-center text-xs text-orange-600">
                  Vui lòng chọn đầy đủ các tùy chọn.
                </p>
              )}
              {product.variants.length > 0 &&
                allRequiredOptionsSelected &&
                !selectedVariant && (
                  <p className="mt-3 text-center text-xs text-red-700">
                    Phiên bản bạn chọn hiện không có sẵn. Vui lòng thử tùy chọn
                    khác.
                  </p>
                )}
            </form>

            {/* Product Description Section */}
            {/* {product.description && (
            // ... (Phần mô tả giữ nguyên) ...
            <div className="mt-10 border-t border-gray-200 pt-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Mô tả sản phẩm
              </h2>
              <div
                className="prose prose-sm sm:prose-base max-w-none text-gray-700"
                dangerouslySetInnerHTML={{
                  __html:
                    product.description ||
                    "<p>Chưa có mô tả cho sản phẩm này.</p>",
                }}
              />
            </div>
          )} */}
          </div>
        </div>
      </div>
      {product && (
        <ProductDescriptionAndReviews
          ref={reviewsSectionRef}
          product={product}
        />
      )}
    </>
  );
}
