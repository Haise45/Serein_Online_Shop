"use client";
import { useApplyCoupon, useRemoveCoupon } from "@/lib/react-query/cartQueries";
import { useGetCoupons } from "@/lib/react-query/couponQueries";
import { formatCurrency } from "@/lib/utils";
import { GetCouponsParams } from "@/services/couponService";
import { ExchangeRates } from "@/types";
import { AppliedCouponInfo, CartItem as CartItemType } from "@/types/cart";
import { Category } from "@/types/category";
import { Coupon } from "@/types/coupon";
import { useEffect, useMemo, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiLoader,
  FiTag,
  FiXCircle,
} from "react-icons/fi";
import { useTranslations } from "next-intl";

interface CouponSectionProps {
  cartSubtotal: number;
  appliedCouponFull?: AppliedCouponInfo | null;
  selectedItems: CartItemType[];
  categoryMap: Map<string, Category>;
  getAncestorsFn: (
    categoryId: string,
    categoryMap: Map<string, Category>,
  ) => string[];
  currencyOptions: { currency: "VND" | "USD"; rates: ExchangeRates | null };
}

export default function CouponSection({
  cartSubtotal,
  appliedCouponFull,
  selectedItems,
  categoryMap,
  getAncestorsFn,
  currencyOptions,
}: CouponSectionProps) {
  const t = useTranslations("CouponSection");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [showApplicableCoupons, setShowApplicableCoupons] = useState(true);

  // Params để fetch các coupon có khả năng áp dụng từ server
  const couponFetchParams: GetCouponsParams = useMemo(
    () => ({
      validNow: true,
      isActive: true,
    }),
    [],
  );

  const { data: paginatedCouponsData, isLoading: isLoadingCoupons } =
    useGetCoupons(couponFetchParams, {
      staleTime: 1000 * 60 * 5, // Cache 5 phút
    });

  const applyCouponMutation = useApplyCoupon();
  const removeCouponMutation = useRemoveCoupon();

  useEffect(() => {
    // Nếu có coupon đã áp dụng, điền vào ô input
    if (appliedCouponFull) {
      setCouponCodeInput(appliedCouponFull.code || "");
    } else {
      setCouponCodeInput(""); // Xóa input nếu coupon bị gỡ
    }
  }, [appliedCouponFull]);

  const handleApplyManualCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCodeInput.trim()) {
      applyCouponMutation.mutate(couponCodeInput);
    }
  };

  const handleApplyListedCoupon = (code: string) => {
    setCouponCodeInput(code);
    applyCouponMutation.mutate(code);
  };

  const handleRemoveAppliedCoupon = () => {
    removeCouponMutation.mutate();
  };

  const filterAndSortDisplayCoupons = (
    coupons: Coupon[] = [],
    currentSelectedItems: CartItemType[],
    currentCartSubtotal: number,
    currentCategoryMap: Map<string, Category>,
    getAncestors: (
      categoryId: string,
      categoryMap: Map<string, Category>,
    ) => string[],
  ) => {
    const now = new Date().getTime();

    // Lấy ID category và product từ các item đã chọn
    const selectedCategoryIdsAndTheirAncestors = new Set<string>(); // Lưu cả ID category và tổ tiên của nó
    const selectedProductIds = new Set<string>();

    currentSelectedItems.forEach((item) => {
      const prodId =
        typeof item.productId === "string"
          ? item.productId
          : item.productId._id.toString();
      selectedProductIds.add(prodId);

      if (
        item.category &&
        typeof item.category !== "string" &&
        item.category._id
      ) {
        const catIdStr = item.category._id.toString();
        selectedCategoryIdsAndTheirAncestors.add(catIdStr);
        const ancestors = getAncestors(catIdStr, currentCategoryMap);
        ancestors.forEach((ancId) =>
          selectedCategoryIdsAndTheirAncestors.add(ancId),
        );
      }
    });

    return coupons
      .filter((coupon) => {
        const startDate = coupon.startDate
          ? new Date(coupon.startDate).getTime()
          : 0;
        const expiryDate = new Date(coupon.expiryDate).getTime();
        const isTimeValid = startDate <= now && now <= expiryDate;
        const hasUsesLeft =
          coupon.maxUsage === undefined ||
          coupon.maxUsage === null ||
          coupon.usageCount < coupon.maxUsage;
        const meetsMinOrder =
          currentCartSubtotal >= (coupon.minOrderValue || 0);
        if (!isTimeValid || !hasUsesLeft || !meetsMinOrder) {
          return false;
        }

        // Kiểm tra applicableTo
        if (coupon.applicableTo === "all") {
          return true;
        }

        if (
          coupon.applicableTo === "products" &&
          coupon.applicableIds &&
          coupon.applicableIds.length > 0
        ) {
          // Kiểm tra xem có sản phẩm nào trong selectedItems khớp với applicableIds của coupon không
          return coupon.applicableIds.some((appId) =>
            selectedProductIds.has(appId.toString()),
          );
        }

        if (
          coupon.applicableTo === "categories" &&
          coupon.applicableIds &&
          coupon.applicableIds.length > 0
        ) {
          // Kiểm tra xem có category nào của selectedItems khớp với applicableIds của coupon không
          return coupon.applicableIds.some((appId) =>
            selectedCategoryIdsAndTheirAncestors.has(appId.toString()),
          );
        }

        return false;
      })
      .sort((a, b) => {
        // Ưu tiên coupon cố định giá trị lớn, rồi đến % lớn
        if (
          a.discountType === "fixed_amount" &&
          b.discountType === "percentage"
        ) {
          return -1;
        }
        if (
          a.discountType === "percentage" &&
          b.discountType === "fixed_amount"
        ) {
          return 1;
        }
        return b.discountValue - a.discountValue; // Giảm nhiều hơn lên trước
      });
  };

  const displayableCoupons = useMemo(() => {
    return filterAndSortDisplayCoupons(
      paginatedCouponsData?.coupons, // Lấy mảng coupons từ data đã fetch
      selectedItems,
      cartSubtotal,
      categoryMap,
      getAncestorsFn,
    );
  }, [
    paginatedCouponsData?.coupons,
    selectedItems,
    cartSubtotal,
    categoryMap,
    getAncestorsFn,
  ]);

  return (
    <dl className="border-t border-gray-200 pt-4">
      <dt className="text-sm font-medium text-gray-900">Mã giảm giá</dt>
      <dd>
        {appliedCouponFull ? (
          <div className="mt-2 flex items-center justify-between rounded-md border border-green-300 bg-green-50 p-2.5">
            <div className="flex items-center">
              <FiTag className="mr-2 h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                {appliedCouponFull.code}
              </span>
            </div>
            <button
              onClick={handleRemoveAppliedCoupon}
              disabled={removeCouponMutation.isPending}
              className="p-1 text-green-500 hover:text-green-700"
            >
              {removeCouponMutation.isPending ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiXCircle className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleApplyManualCoupon}
            className="mt-2 flex space-x-2"
          >
            <input
              type="text"
              value={couponCodeInput}
              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
              placeholder={t("inputPlaceholder")}
              className="block w-full rounded-md border-gray-300 px-3 py-1.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={applyCouponMutation.isPending}
            />
            <button
              type="submit"
              disabled={
                applyCouponMutation.isPending || !couponCodeInput.trim()
              }
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applyCouponMutation.isPending &&
              applyCouponMutation.variables === couponCodeInput.trim() ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                t("applyButton")
              )}
            </button>
          </form>
        )}

        {/* Danh sách coupon khả dụng */}
        {isLoadingCoupons && (
          <div className="mt-3 text-center">
            <FiLoader className="inline-block h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-xs text-gray-500">
              {t("loadingCoupons")}
            </span>
          </div>
        )}

        {!isLoadingCoupons &&
          displayableCoupons &&
          displayableCoupons.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowApplicableCoupons(!showApplicableCoupons)}
                className="flex w-full items-center justify-between text-left text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <span>
                  {t("viewAvailableCoupons", {
                    count: displayableCoupons.length,
                  })}
                </span>
                {showApplicableCoupons ? (
                  <FiChevronUp className="h-4 w-4" />
                ) : (
                  <FiChevronDown className="h-4 w-4" />
                )}
              </button>
              {showApplicableCoupons && (
                <div className="scrollbar-thin mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                  {displayableCoupons.map((coupon) => (
                    <div
                      key={coupon._id.toString()}
                      className="rounded-md border border-dashed border-indigo-300 bg-indigo-50/50 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-indigo-700">
                          {coupon.code}
                          <p className="text-[10px] leading-tight font-normal text-gray-500">
                            {coupon.discountType === "percentage"
                              ? t("discountPercentage", {
                                  value: coupon.discountValue,
                                })
                              : t("discountFixed", {
                                  value: formatCurrency(
                                    coupon.discountValue,
                                    currencyOptions,
                                  ),
                                })}
                            {coupon.minOrderValue > 0 &&
                              t("forOrdersFrom", {
                                value: formatCurrency(
                                  coupon.minOrderValue,
                                  currencyOptions,
                                ),
                              })}
                          </p>
                        </div>
                        {coupon.code !== appliedCouponFull?.code && (
                          <button
                            onClick={() => handleApplyListedCoupon(coupon.code)}
                            disabled={
                              applyCouponMutation.isPending &&
                              applyCouponMutation.variables === coupon.code
                            }
                            className="ml-2 rounded bg-indigo-100 px-2 py-1 text-[10px] font-medium text-indigo-700 hover:bg-indigo-200 disabled:opacity-60"
                          >
                            {applyCouponMutation.isPending &&
                            applyCouponMutation.variables === coupon.code ? (
                              <FiLoader className="h-3 w-3 animate-spin" />
                            ) : (
                              t("applyButton")
                            )}
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-gray-500">
                        {t("expiryDate", {
                          date: new Date(coupon.expiryDate).toLocaleDateString(
                            "vi-VN",
                          ),
                        })}
                        {coupon.maxUsage != null &&
                          coupon.usageCount != null && (
                            <>
                              {" "}
                              {t("usesLeft", {
                                count: coupon.maxUsage - coupon.usageCount,
                              })}
                            </>
                          )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
      </dd>
    </dl>
  );
}
