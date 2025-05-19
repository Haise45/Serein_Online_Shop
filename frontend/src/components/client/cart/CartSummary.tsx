"use client";
import { formatCurrency } from "@/lib/utils";
import { CartData, CartItem as CartItemType } from "@/types/cart";
import { Category } from "@/types/category";
import classNames from "classnames";
import Link from "next/link";
import { useMemo } from "react";
import toast from "react-hot-toast";
import CouponSection from "./CouponSection";

interface CartSummaryProps {
  originalCart: CartData; // Giỏ hàng gốc với tất cả items và coupon (nếu có)
  selectedItemsForSummary: CartItemType[]; // Chỉ các items được người dùng chọn
  categoryMap: Map<string, Category>;
  getAncestorsFn: (
    categoryId: string,
    categoryMap: Map<string, Category>,
  ) => string[];
}

export default function CartSummary({
  originalCart,
  selectedItemsForSummary,
  categoryMap,
  getAncestorsFn,
}: CartSummaryProps) {
  // Tính toán lại subtotal và totalQuantity DỰA TRÊN selectedItemsForSummary
  const selectedSubtotal = useMemo(() => {
    return selectedItemsForSummary.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
  }, [selectedItemsForSummary]);

  const numberOfSelectedProductTypes = selectedItemsForSummary.length;

  // Tính toán discountAmount CHỈ cho các selectedItemsForSummary
  // dựa trên coupon đã được áp dụng cho originalCart.
  const discountAmountForSelected = useMemo(() => {
    if (!originalCart.appliedCoupon || selectedItemsForSummary.length === 0) {
      return 0;
    }

    const coupon = originalCart.appliedCoupon;
    let applicableSubtotalForSelectedItems = 0;
    let foundApplicableItemSelected = false;

    // Tạo Set các ID sản phẩm đã chọn
    const selectedProductIds = new Set(
      selectedItemsForSummary.map((item) =>
        typeof item.productId === "string"
          ? item.productId
          : item.productId._id.toString(),
      ),
    );

    // Tạo Set các ID category (và tổ tiên) của các sản phẩm đã chọn
    const selectedCategoryIdsAndAncestors = new Set<string>();
    selectedItemsForSummary.forEach((item) => {
      if (
        item.category &&
        typeof item.category !== "string" &&
        item.category._id
      ) {
        const catIdStr = item.category._id.toString();
        selectedCategoryIdsAndAncestors.add(catIdStr);
        const ancestors = getAncestorsFn(catIdStr, categoryMap);
        ancestors.forEach((ancId) =>
          selectedCategoryIdsAndAncestors.add(ancId),
        );
      }
    });

    if (coupon.applicableTo === "all") {
      applicableSubtotalForSelectedItems = selectedSubtotal; // Tính trên tổng của các sản phẩm đã chọn
      foundApplicableItemSelected = selectedItemsForSummary.length > 0;
    } else if (
      coupon.applicableTo === "products" &&
      coupon.applicableIds &&
      coupon.applicableIds.length > 0
    ) {
      const applicableItems = selectedItemsForSummary.filter(
        (item) =>
          coupon.applicableIds.some((appId) =>
            selectedProductIds.has(appId.toString()),
          ) && // Kiểm tra xem coupon có áp dụng cho bất kỳ SP đã chọn nào không
          coupon.applicableIds.includes(
            typeof item.productId === "string"
              ? item.productId
              : item.productId._id.toString(),
          ), // Và item hiện tại phải nằm trong danh sách đó
      );
      if (applicableItems.length > 0) {
        foundApplicableItemSelected = true;
        applicableSubtotalForSelectedItems = applicableItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
      }
    } else if (
      coupon.applicableTo === "categories" &&
      coupon.applicableIds &&
      coupon.applicableIds.length > 0
    ) {
      const applicableItems = selectedItemsForSummary.filter((item) => {
        if (
          item.category &&
          typeof item.category !== "string" &&
          item.category._id
        ) {
          const itemCategoryId = item.category._id.toString();
          const itemCategoryAndItsAncestors = new Set([
            itemCategoryId,
            ...getAncestorsFn(itemCategoryId, categoryMap),
          ]);
          // Kiểm tra xem coupon có áp dụng cho bất kỳ category/ancestor nào của các SP đã chọn không
          // VÀ category (hoặc tổ tiên) của item hiện tại có nằm trong danh sách applicableIds của coupon không
          return (
            coupon.applicableIds.some((appId) =>
              selectedCategoryIdsAndAncestors.has(appId.toString()),
            ) &&
            coupon.applicableIds.some((appId) =>
              itemCategoryAndItsAncestors.has(appId.toString()),
            )
          );
        }
        return false;
      });
      if (applicableItems.length > 0) {
        foundApplicableItemSelected = true;
        applicableSubtotalForSelectedItems = applicableItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
      }
    }

    if (!foundApplicableItemSelected) {
      return 0;
    }

    if (
      coupon.minOrderValue > 0 &&
      applicableSubtotalForSelectedItems < coupon.minOrderValue
    ) {
      return 0;
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount =
        (applicableSubtotalForSelectedItems * coupon.discountValue) / 100;
    } else if (coupon.discountType === "fixed_amount") {
      calculatedDiscount = coupon.discountValue;
    }

    return Math.min(
      Math.round(calculatedDiscount),
      applicableSubtotalForSelectedItems,
    );
  }, [
    originalCart.appliedCoupon,
    selectedItemsForSummary,
    selectedSubtotal,
    categoryMap,
    getAncestorsFn,
  ]);

  const finalTotalForSelected = selectedSubtotal - discountAmountForSelected;

  const canProceedToCheckout = selectedItemsForSummary.length > 0;

  return (
    <section
      aria-labelledby="summary-heading"
      className="sticky top-20 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:col-span-4 lg:p-8"
    >
      <h2 id="summary-heading" className="text-xl font-semibold text-gray-900">
        Tóm tắt đơn hàng
      </h2>

      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-600">
            Sản phẩm đã chọn ({numberOfSelectedProductTypes})
          </dt>
          <dd className="text-sm font-medium text-gray-900">
            {formatCurrency(selectedSubtotal)}
          </dd>
        </div>

        {/* Truyền selectedSubtotal để CouponSection có thể kiểm tra minOrderValue cho các coupon */}
        <CouponSection
          cartSubtotal={selectedSubtotal}
          appliedCouponCode={originalCart.appliedCoupon?.code}
          selectedItems={selectedItemsForSummary}
          categoryMap={categoryMap}
          getAncestorsFn={getAncestorsFn}
        />

        {originalCart.appliedCoupon && discountAmountForSelected > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <dt className="flex items-center text-sm text-green-600">
              <span>Giảm giá ({originalCart.appliedCoupon.code})</span>
            </dt>
            <dd className="text-sm font-medium text-green-600">
              -{formatCurrency(discountAmountForSelected)}
            </dd>
          </div>
        )}

        {/* ... Phí vận chuyển ... */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <dt className="text-base font-semibold text-gray-900">
            Tổng cộng (tạm tính)
          </dt>
          <dd className="text-base font-semibold text-gray-900">
            {formatCurrency(finalTotalForSelected)}
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <Link
          href={canProceedToCheckout ? "/checkout" : "#"} // Điều hướng đến checkout nếu có item được chọn
          onClick={(e) => {
            if (!canProceedToCheckout) {
              e.preventDefault();
              toast.error("Vui lòng chọn ít nhất một sản phẩm để tiếp tục.");
            }
          }}
          className={classNames(
            "block w-full rounded-md border border-transparent px-6 py-3 text-center text-base font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none",
            canProceedToCheckout
              ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
              : "cursor-not-allowed bg-gray-400",
          )}
          aria-disabled={!canProceedToCheckout}
        >
          Tiến hành đặt hàng ({numberOfSelectedProductTypes})
        </Link>
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Hoặc tiếp tục mua sắm<span aria-hidden="true"> →</span>
        </Link>
      </div>
    </section>
  );
}
