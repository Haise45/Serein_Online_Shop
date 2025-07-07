"use client";

import { formatCurrency } from "@/lib/utils";
import { AppDispatch } from "@/store";
import { setSelectedItemsForCheckout } from "@/store/slices/checkoutSlice";
import {
  CartData,
  CartItem as CartItemType,
  Category,
  ExchangeRates,
} from "@/types";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle } from "react-icons/fi";
import { useDispatch } from "react-redux";
import CouponSection from "./CouponSection";
import { useTranslations } from "next-intl";

interface CartSummaryProps {
  originalCart: CartData; // Giỏ hàng gốc với tất cả items và coupon (nếu có)
  selectedItemsForSummary: CartItemType[]; // Chỉ các items được người dùng chọn
  categoryMap: Map<string, Category>; // Map để tra cứu category
  getAncestorsFn: (
    categoryId: string,
    categoryMap: Map<string, Category>,
  ) => string[]; // Hàm để lấy tổ tiên category
  currencyOptions: { currency: "VND" | "USD"; rates: ExchangeRates | null };
}

export default function CartSummary({
  originalCart,
  selectedItemsForSummary,
  categoryMap,
  getAncestorsFn,
  currencyOptions,
}: CartSummaryProps) {
  const t = useTranslations("CartSummary");
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // --- Tính toán lại các giá trị DỰA TRÊN các sản phẩm đã được chọn ---

  // 1. Tính tổng tiền tạm tính của các sản phẩm đã chọn
  const selectedSubtotal = useMemo(() => {
    return selectedItemsForSummary.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
  }, [selectedItemsForSummary]);

  // 2. Tính tổng số lượng và số loại sản phẩm đã chọn
  const numberOfSelectedProductLines = selectedItemsForSummary.length;
  const totalSelectedQuantity = useMemo(() => {
    return selectedItemsForSummary.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );
  }, [selectedItemsForSummary]);

  // 3. Tính lại số tiền được giảm giá (logic này giữ nguyên)
  const discountAmountForSelected = useMemo(() => {
    if (!originalCart.appliedCoupon || selectedItemsForSummary.length === 0) {
      return 0;
    }
    const coupon = originalCart.appliedCoupon;
    const applicableItems = selectedItemsForSummary.filter((item) => {
      if (coupon.applicableTo === "all") return true;
      if (!coupon.applicableIds || coupon.applicableIds.length === 0)
        return false;
      const applicableIdsStr = coupon.applicableIds.map((id) => id.toString());
      if (coupon.applicableTo === "products") {
        return applicableIdsStr.includes(item.productId.toString());
      }
      if (coupon.applicableTo === "categories" && item.category) {
        const itemCategoryIdStr = item.category._id.toString();
        const categoryAndAncestors = new Set([
          itemCategoryIdStr,
          ...getAncestorsFn(itemCategoryIdStr, categoryMap),
        ]);
        return applicableIdsStr.some((appId) =>
          categoryAndAncestors.has(appId),
        );
      }
      return false;
    });
    if (applicableItems.length === 0) return 0;
    const applicableSubtotal = applicableItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const minOrderValue = coupon.minOrderValue || 0;
    if (minOrderValue > 0 && applicableSubtotal < minOrderValue) {
      return 0;
    }
    let calculatedDiscount = 0;
    const discountValue = coupon.discountValue || 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = (applicableSubtotal * discountValue) / 100;
    } else if (coupon.discountType === "fixed_amount") {
      calculatedDiscount = discountValue;
    }
    return Math.min(Math.round(calculatedDiscount), applicableSubtotal);
  }, [
    originalCart.appliedCoupon,
    selectedItemsForSummary,
    categoryMap,
    getAncestorsFn,
  ]);

  // 4. Tính tổng tiền cuối cùng
  const finalTotalForSelected = selectedSubtotal - discountAmountForSelected;

  // --- LOGIC MỚI: Kiểm tra lỗi tồn kho trong các sản phẩm đã chọn ---
  const hasStockErrorInSelectedItems = useMemo(() => {
    return selectedItemsForSummary.some(
      (item) => item.quantity > item.availableStock,
    );
  }, [selectedItemsForSummary]);

  // --- Cập nhật điều kiện để có thể đi đến trang thanh toán ---
  const canProceedToCheckout =
    selectedItemsForSummary.length > 0 && !hasStockErrorInSelectedItems;

  const handleProceedToCheckout = () => {
    if (hasStockErrorInSelectedItems) {
      toast.error(t("stockErrorToast"));
      return;
    }
    if (selectedItemsForSummary.length === 0) {
      toast.error(t("noItemsSelectedToast"));
      return;
    }

    const selectedIds = selectedItemsForSummary.map((item) => item._id);
    dispatch(setSelectedItemsForCheckout(selectedIds));
    router.push("/checkout");
  };

  return (
    <section
      aria-labelledby="summary-heading"
      className="sticky top-20 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-4 lg:p-8"
    >
      <h2 id="summary-heading" className="text-xl font-semibold text-gray-900">
        {t("title")}
      </h2>

      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-600">
            {t("subtotalLabel", {
              lineCount: numberOfSelectedProductLines,
              quantityCount: totalSelectedQuantity,
            })}
          </dt>
          <dd className="text-sm font-medium text-gray-900">
            {formatCurrency(selectedSubtotal, currencyOptions)}
          </dd>
        </div>

        {/* ... (CouponSection giữ nguyên) ... */}
        <CouponSection
          cartSubtotal={selectedSubtotal}
          appliedCouponFull={originalCart.appliedCoupon}
          selectedItems={selectedItemsForSummary}
          categoryMap={categoryMap}
          getAncestorsFn={getAncestorsFn}
          currencyOptions={currencyOptions}
        />

        {originalCart.appliedCoupon && discountAmountForSelected > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <dt className="flex items-center text-sm text-green-600">
              <span>
                {t("discountLabel", {
                  code: originalCart.appliedCoupon.code ?? "",
                })}
              </span>
            </dt>
            <dd className="text-sm font-medium text-green-600">
              -{formatCurrency(discountAmountForSelected, currencyOptions)}
            </dd>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <dt className="text-base font-semibold text-gray-900">
            {t("totalLabel")}
          </dt>
          <dd className="text-base font-semibold text-gray-900">
            {formatCurrency(finalTotalForSelected, currencyOptions)}
          </dd>
        </div>
      </dl>

      {/* THÊM KHỐI THÔNG BÁO LỖI TỒN KHO */}
      {hasStockErrorInSelectedItems && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {t("stockErrorNotice")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <button
          type="button"
          onClick={handleProceedToCheckout}
          disabled={!canProceedToCheckout}
          className={classNames(
            "block w-full rounded-md border border-transparent px-6 py-3 text-center text-base font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none",
            canProceedToCheckout
              ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
              : "cursor-not-allowed bg-gray-400",
          )}
        >
          {t("proceedToCheckoutButton", { count: totalSelectedQuantity })}
        </button>
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          {t("continueShoppingLink")}
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </section>
  );
}
