"use client";

import { useSettings } from "@/app/SettingsContext";
import ImageGallery from "@/components/client/product/ImageGallery";
import ProductDescriptionAndReviews, {
  ProductReviewsRef,
} from "@/components/client/product/ProductDescriptionAndReviews";
import RatingStars from "@/components/shared/RatingStars";
import { useGetAttributes } from "@/lib/react-query/attributeQueries";
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
import {
  Attribute,
  AttributeValue,
  ProductAttribute,
  Variant,
  VariantOptionValue,
} from "@/types";
import classNames from "classnames";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  FiSlash,
  FiTag,
  FiTrendingUp,
  FiXCircle,
} from "react-icons/fi";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";

interface ProductDetailsClientProps {
  slug: string;
}

export default function ProductDetailsClient({
  slug,
}: ProductDetailsClientProps) {
  // --- Hooks ---
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const reviewsSectionRef = useRef<ProductReviewsRef>(null);
  const isInitialMount = useRef(true);
  const { displayCurrency, rates } = useSettings();
  const t = useTranslations("ProductDetailsPage");

  // --- Data Fetching ---
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useGetProductDetails(slug);
  const { isLoading: isLoadingAttributes } = useGetAttributes();
  const { data: wishlistData } = useGetWishlist();
  const addToCartMutation = useAddToCart();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();

  // --- State ---
  // State giờ đây lưu theo dạng { attributeId: valueId }
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | null>
  >({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const colorAttributeId = useMemo(() => {
    if (!product?.attributes) return null;
    const colorAttrWrapper = (product.attributes as ProductAttribute[]).find(
      (aw) => {
        const attr = aw.attribute as Attribute;
        return attr?.name === "color";
      },
    );
    return (colorAttrWrapper?.attribute as Attribute)?._id || null;
  }, [product?.attributes]);

  const variantIdFromUrl = useMemo(
    () => searchParams.get("variant"),
    [searchParams],
  );

  // --- useEffects để đồng bộ state ---
  // Effect 1: Đồng bộ hóa trạng thái từ URL (khi tải trang hoặc back/forward)
  useEffect(() => {
    if (!product) return;

    // Tìm variant từ URL
    const variantFromUrl = variantIdFromUrl
      ? product.variants.find((v) => v._id === variantIdFromUrl)
      : null;

    if (variantFromUrl) {
      // Nếu variant từ URL khác với variant đang được chọn, hãy cập nhật state
      if (variantFromUrl._id !== selectedVariant?._id) {
        const newOptions: Record<string, string | null> = {};
        (variantFromUrl.optionValues as VariantOptionValue[]).forEach((ov) => {
          const attrId = (ov.attribute as Attribute)._id;
          const valueId = (ov.value as AttributeValue)._id;
          newOptions[attrId] = valueId;
        });

        // Đảm bảo tất cả thuộc tính đều có key
        (product.attributes as ProductAttribute[]).forEach((attrWrapper) => {
          const attrId = (attrWrapper.attribute as Attribute)._id;
          if (!(attrId in newOptions)) {
            newOptions[attrId] = null;
          }
        });

        setSelectedOptions(newOptions);
        setSelectedVariant(variantFromUrl);
        setQuantity(1);
      }
    } else {
      // Nếu không có variantId trên URL, hãy khởi tạo state trống
      const initialOptions: Record<string, string | null> = {};
      (product.attributes as ProductAttribute[]).forEach((attrWrapper) => {
        const attrId = (attrWrapper.attribute as Attribute)._id;
        initialOptions[attrId] = null;
      });
      setSelectedOptions(initialOptions);
      setSelectedVariant(null);
      setQuantity(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, variantIdFromUrl]); // Chỉ phụ thuộc vào product và variantId từ URL

  // Effect 2: Tìm variant dựa trên lựa chọn của người dùng và cập nhật URL
  useEffect(() => {
    // Bỏ qua lần render đầu tiên để tránh ghi đè URL không cần thiết
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!product) return;

    const allOptionsSelected = (product.attributes as ProductAttribute[]).every(
      (attrWrapper) =>
        !!selectedOptions[(attrWrapper.attribute as Attribute)._id],
    );

    let newUrl = pathname;
    let variantToSet: Variant | null = null;

    if (allOptionsSelected) {
      const foundVariant = product.variants.find((variant) =>
        (variant.optionValues as VariantOptionValue[]).every((ov) => {
          const attrId = (ov.attribute as Attribute)._id;
          const valueId = (ov.value as AttributeValue)._id;
          return selectedOptions[attrId] === valueId;
        }),
      );

      variantToSet = foundVariant || null;

      if (foundVariant) {
        newUrl = `${pathname}?variant=${foundVariant._id}`;
      }
    }

    // Cập nhật variant nếu có thay đổi thực sự
    if (selectedVariant?._id !== variantToSet?._id) {
      setSelectedVariant(variantToSet);
      setQuantity(1); // Reset số lượng khi đổi variant
    }

    // Cập nhật URL một cách nhẹ nhàng, chỉ khi URL thực sự thay đổi
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, selectedOptions, pathname, router]);

  // --- Logic hiển thị ---

  const allRequiredOptionsSelected = useMemo(() => {
    if (!product?.attributes || product.attributes.length === 0) return true;
    return (product.attributes as ProductAttribute[]).every((attrWrapper) => {
      // Quan trọng: Phải lấy _id từ object attribute, không phải cast object thành string
      const attributeId = (attrWrapper.attribute as Attribute)?._id;
      if (!attributeId) return false;
      return !!selectedOptions[attributeId];
    });
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

  // === HÀM getDisabledOptions ĐÃ ĐƯỢC CẬP NHẬT ===
  const getDisabledOptionsForAttribute = useCallback(
    (attributeIdToTest: string): Set<string> => {
      if (!product?.variants || !product.attributes) return new Set();

      // Lấy các lựa chọn đã được chọn ở các thuộc tính KHÁC
      const otherSelectedOptions = Object.entries(selectedOptions).filter(
        ([attrId, valueId]) => attrId !== attributeIdToTest && valueId !== null,
      );

      // Tìm tất cả các biến thể tương thích với các lựa chọn khác đó
      const compatibleVariants = product.variants.filter((variant) =>
        otherSelectedOptions.every(([attrId, valueId]) =>
          (variant.optionValues as VariantOptionValue[]).some(
            (ov) =>
              (ov.attribute as Attribute)._id === attrId &&
              (ov.value as AttributeValue)._id === valueId,
          ),
        ),
      );

      // Từ các biến thể tương thích, thu thập tất cả các giá trị hợp lệ cho thuộc tính đang xét
      const availableValues = new Set<string>();
      compatibleVariants.forEach((variant) => {
        (variant.optionValues as VariantOptionValue[]).forEach((ov) => {
          if ((ov.attribute as Attribute)._id === attributeIdToTest) {
            availableValues.add((ov.value as AttributeValue)._id);
          }
        });
      });

      // Một tùy chọn bị vô hiệu hóa nếu nó không nằm trong tập hợp các giá trị hợp lệ
      const allPossibleValuesForAttr =
        ((product.attributes as ProductAttribute[]).find(
          (a) => (a.attribute as Attribute)._id === attributeIdToTest,
        )?.values as AttributeValue[]) || [];

      const disabledValues = new Set<string>();
      allPossibleValuesForAttr.forEach((valueOption) => {
        if (!availableValues.has(valueOption._id)) {
          disabledValues.add(valueOption._id);
        }
      });

      return disabledValues;
    },
    [product, selectedOptions],
  );

  const imagesToDisplay = useMemo(() => {
    // Ưu tiên 1: Ảnh của biến thể đã chọn đầy đủ
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      return selectedVariant.images;
    }
    // Ưu tiên 2: Nếu đã chọn màu, tìm ảnh của một biến thể bất kỳ có màu đó
    if (colorAttributeId && selectedOptions[colorAttributeId]) {
      const selectedColorValueId = selectedOptions[colorAttributeId];
      const variantWithColorImage = product?.variants.find(
        (v) =>
          (v.optionValues as VariantOptionValue[]).some(
            (opt) =>
              opt.attribute === colorAttributeId &&
              opt.value === selectedColorValueId,
          ) &&
          v.images &&
          v.images.length > 0,
      );
      if (variantWithColorImage?.images?.length) {
        return variantWithColorImage.images;
      }
    }
    // Mặc định: Ảnh chính của sản phẩm
    return product?.images || [];
  }, [product, selectedVariant, selectedOptions, colorAttributeId]);

  // --- Handlers ---
  const handleScrollToReviews = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    reviewsSectionRef.current?.focusReviewsTab(); // Gọi hàm từ component con
  };

  const handleOptionSelect = (attributeId: string, valueId: string | null) => {
    setSelectedOptions((prev) => ({ ...prev, [attributeId]: valueId }));
  };

  // const imagesToDisplay = useMemo(() => {
  //   if (selectedVariant?.images && selectedVariant.images.length > 0) {
  //     return selectedVariant.images;
  //   }
  //   if (selectedOptions["Màu sắc"] && product?.variants) {
  //     const colorMatchedVariant = product.variants.find(
  //       (v) =>
  //         v.optionValues.some(
  //           (opt) =>
  //             opt.attributeName === "Màu sắc" &&
  //             opt.value === selectedOptions["Màu sắc"],
  //         ) &&
  //         v.images &&
  //         v.images.length > 0,
  //     );
  //     if (colorMatchedVariant?.images?.length) {
  //       return colorMatchedVariant.images;
  //     }
  //   }
  //   return product?.images || [];
  // }, [product, selectedVariant, selectedOptions]);

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

  // --- Display values ---
  // Lấy ra giá gốc (không sale) của sản phẩm chính để làm giá tham chiếu
  const baseOriginalPrice = product?.price ?? 0;
  // Lấy ra giá sale của sản phẩm chính
  const baseSalePrice = product?.displayPrice ?? 0;

  // Giá gốc (không sale) để hiển thị: ưu tiên giá của variant, nếu không có thì lấy giá sản phẩm chính
  const priceToDisplay = selectedVariant?.price ?? baseOriginalPrice;

  // Giá cuối cùng (đã sale) để hiển thị: ưu tiên giá của variant, nếu không có thì lấy giá sản phẩm chính
  const displayPriceFinal = selectedVariant?.displayPrice ?? baseSalePrice;

  // Trạng thái sale: ưu tiên của variant, nếu không thì lấy của sản phẩm chính
  const isOnSaleFinal = selectedVariant?.isOnSale ?? product?.isOnSale ?? false;

  // Các biến khác giữ nguyên logic
  const skuToDisplay = selectedVariant?.sku ?? product?.sku ?? "N/A";
  const totalSoldDisplay = product?.totalSold ?? 0;

  // Tính toán phần trăm giảm giá dựa trên các giá trị đã được xác định ở trên
  const percentageDiscount =
    isOnSaleFinal && priceToDisplay > displayPriceFinal
      ? Math.round(
          ((priceToDisplay - displayPriceFinal) / priceToDisplay) * 100,
        )
      : 0;

  const currencyOptions = useMemo(
    () => ({
      currency: displayCurrency,
      rates: rates,
    }),
    [displayCurrency, rates],
  );

  const buttonState = useMemo(() => {
    if (addToCartMutation.isPending) {
      return {
        text: t("addToCartButton.adding"),
        disabled: true,
        icon: <FiLoader className="mr-2 h-5 w-5 animate-spin" />,
      };
    }
    if (product && product.variants.length > 0) {
      if (!allRequiredOptionsSelected) {
        return {
          text: t("addToCartButton.selectOptions"),
          disabled: true,
          icon: <FiInfo className="mr-2 h-5 w-5" />,
        };
      }
      if (!selectedVariant) {
        return {
          text: t("addToCartButton.variantUnavailable"),
          disabled: true,
          icon: <FiXCircle className="mr-2 h-5 w-5" />,
        };
      }
    }
    if (stockToDisplay <= 0) {
      return {
        text: t("addToCartButton.outOfStock"),
        disabled: true,
        icon: <FiSlash className="mr-2 h-5 w-5" />,
      };
    }
    return {
      text: t("addToCartButton.default"),
      disabled: false,
      icon: <FiShoppingCart className="mr-2 h-5 w-5" />,
    };
  }, [
    product,
    allRequiredOptionsSelected,
    selectedVariant,
    stockToDisplay,
    addToCartMutation.isPending,
    t,
  ]);

  if (isLoading || isLoadingAttributes) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <FiLoader className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="ml-4 text-lg text-gray-600">{t("loadingProduct")}</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <FiAlertCircle className="h-16 w-16 text-red-400" />
        <p className="mt-4 text-xl font-semibold text-red-700">
          {t("errorLoadingProduct")}
        </p>
        <p className="mt-2 max-w-md text-gray-600">
          {error instanceof Error ? error.message : t("errorProductNotFound")}
        </p>
        <Link
          href="/products"
          className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t("backToProductsButton")}
        </Link>
      </div>
    );
  }

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
                {product?.name}
              </h1>
              <div className="mt-2">
                {/* ... Price section ... */}
                <p className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  {formatCurrency(displayPriceFinal, currencyOptions)}
                  {isOnSaleFinal && percentageDiscount > 0 && (
                    <span className="ml-2 text-base font-medium text-red-500">
                      {t("priceSaleBadge", { percentage: percentageDiscount })}
                    </span>
                  )}
                </p>
                {isOnSaleFinal && priceToDisplay > displayPriceFinal && (
                  <p className="mt-1 text-lg text-gray-500 line-through">
                    {formatCurrency(priceToDisplay, currencyOptions)}
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
                      {t("reviewsLink", { count: product.numReviews })}
                    </a>
                  ) : (
                    <p className="ml-3 text-sm text-gray-500">
                      {t("noReviews")}
                    </p>
                  )}
                </div>
                {/* SKU hiển thị có điều kiện */}
                <div className="mt-3">
                  <p className="flex items-center text-sm text-gray-600">
                    <FiTag className="mr-2 h-4 w-4 text-gray-400" />
                    {t("skuLabel")}{" "}
                    <span className="ml-1 font-medium text-gray-800">
                      {skuToDisplay}
                    </span>
                  </p>
                </div>

                <div className="mt-1 space-y-1.5 text-sm text-gray-600">
                  {/* ... Đã bán, Danh mục ... */}
                  <p className="flex items-center">
                    <FiTrendingUp className="mr-2 h-4 w-4 text-gray-400" />
                    {t("soldLabel")}{" "}
                    <span className="ml-1 font-medium text-gray-800">
                      {totalSoldDisplay}
                    </span>
                  </p>
                  {product.category && typeof product.category !== "string" && (
                    <p className="flex items-center">
                      {" "}
                      <FiInfo className="mr-2 h-4 w-4 text-gray-400" />{" "}
                      {t("categoryLabel")}{" "}
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
              {/* Phần chọn thuộc tính */}
              {product.attributes && product.attributes.length > 0 && (
                <div className="space-y-6 border-t border-gray-200 pt-6">
                  {(product.attributes as ProductAttribute[]).map(
                    (attrWrapper) => {
                      const attribute = attrWrapper.attribute as Attribute;
                      if (!attribute) return null;
                      const disabledOptionsSet = getDisabledOptionsForAttribute(
                        attribute._id,
                      );

                      return (
                        <div key={attribute._id}>
                          <h3 className="flex items-center text-sm font-medium text-gray-900">
                            {attribute.label}
                          </h3>
                          <div
                            className={classNames(
                              "mt-3 grid gap-3",
                              attribute.name === "color"
                                ? "grid-cols-6 sm:grid-cols-8"
                                : "grid-cols-3 sm:grid-cols-4",
                            )}
                          >
                            {(attrWrapper.values as AttributeValue[]).map(
                              (valueOption) => {
                                const isSelected =
                                  selectedOptions[attribute._id] ===
                                  valueOption._id;
                                const isDisabled = disabledOptionsSet.has(
                                  valueOption._id,
                                );

                                // Render ô màu
                                if (attribute.name === "color") {
                                  const hex =
                                    (valueOption.meta?.hex as string) ||
                                    "#E5E7EB";
                                  const borderColor =
                                    (valueOption.meta?.borderColor as string) ||
                                    "transparent";
                                  return (
                                    <button
                                      key={valueOption._id}
                                      type="button"
                                      title={valueOption.value}
                                      disabled={isDisabled}
                                      onClick={() =>
                                        handleOptionSelect(
                                          attribute._id,
                                          isSelected ? null : valueOption._id,
                                        )
                                      }
                                      className={classNames(
                                        "relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-200 focus:outline-none",
                                        isDisabled
                                          ? "cursor-not-allowed"
                                          : "cursor-pointer hover:scale-110",
                                        isSelected
                                          ? "border-indigo-500 ring-2 ring-indigo-500 ring-offset-1"
                                          : "border-transparent",
                                        !isSelected && !isDisabled
                                          ? `hover:border-indigo-400`
                                          : "",
                                      )}
                                      style={{
                                        backgroundColor: hex,
                                        borderColor: borderColor,
                                      }}
                                    >
                                      {isDisabled && (
                                        <FiSlash className="h-4 w-4 text-white mix-blend-difference" />
                                      )}
                                    </button>
                                  );
                                }

                                // Render nút text
                                return (
                                  <button
                                    key={valueOption._id}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() =>
                                      handleOptionSelect(
                                        attribute._id,
                                        isSelected ? null : valueOption._id,
                                      )
                                    }
                                    className={classNames(
                                      "flex items-center justify-center rounded-md border px-3 py-2 text-xs font-medium uppercase transition-colors duration-150 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none",
                                      isDisabled
                                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                        : isSelected
                                          ? "border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                                          : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
                                    )}
                                  >
                                    {valueOption.value}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}

              {/* Quantity - Chỉ hiển thị khi đã chọn đủ variant hoặc sản phẩm không có variant */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-gray-900">
                    {t("quantityLabel")}
                  </h3>
                  {showStockInfo && (
                    <p className="text-sm font-medium text-gray-500">
                      {stockToDisplay > 0 ? (
                        t("stockRemaining", { count: stockToDisplay })
                      ) : (
                        <span className="font-semibold text-red-600">
                          {t("outOfStock")}
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
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={buttonState.disabled}
                  className="flex w-full flex-1 items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition-colors duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {buttonState.icon}
                  {buttonState.text}
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
                    isFavorite
                      ? t("wishlistButton.remove")
                      : t("wishlistButton.add")
                  }
                >
                  <FiHeart
                    className={classNames("h-5 w-5", {
                      "fill-current": isFavorite,
                    })}
                  />
                </button>
              </div>
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
