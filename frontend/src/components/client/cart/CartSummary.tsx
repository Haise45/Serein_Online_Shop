"use client";

import { formatCurrency } from "@/lib/utils";
import { AppDispatch } from "@/store";
import { setSelectedItemsForCheckout } from "@/store/slices/checkoutSlice";
import { CartData, CartItem as CartItemType, Category } from "@/types";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import CouponSection from "./CouponSection";

interface CartSummaryProps {
  originalCart: CartData; // Giỏ hàng gốc với tất cả items và coupon (nếu có)
  selectedItemsForSummary: CartItemType[]; // Chỉ các items được người dùng chọn
  categoryMap: Map<string, Category>; // Map để tra cứu category
  getAncestorsFn: (
    categoryId: string,
    categoryMap: Map<string, Category>,
  ) => string[]; // Hàm để lấy tổ tiên category
}

export default function CartSummary({
  originalCart,
  selectedItemsForSummary,
  categoryMap,
  getAncestorsFn,
}: CartSummaryProps) {
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

  // 3. Tính lại số tiền được giảm giá chỉ cho các sản phẩm đã chọn
  const discountAmountForSelected = useMemo(() => {
    // Không có giảm giá nếu không có coupon hoặc không có sản phẩm nào được chọn
    if (!originalCart.appliedCoupon || selectedItemsForSummary.length === 0) {
      return 0;
    }

    const coupon = originalCart.appliedCoupon;

    // Lọc ra những item trong danh sách ĐÃ CHỌN mà coupon có thể áp dụng
    const applicableItems = selectedItemsForSummary.filter((item) => {
      // Trường hợp 1: Coupon áp dụng cho tất cả sản phẩm
      if (coupon.applicableTo === "all") return true;
      if (!coupon.applicableIds || coupon.applicableIds.length === 0)
        return false;

      const applicableIdsStr = coupon.applicableIds.map((id) => id.toString());

      // Trường hợp 2: Coupon áp dụng cho sản phẩm cụ thể
      if (coupon.applicableTo === "products") {
        return applicableIdsStr.includes(item.productId.toString());
      }

      // Trường hợp 3: Coupon áp dụng cho danh mục cụ thể (bao gồm cả danh mục cha)
      if (coupon.applicableTo === "categories" && item.category) {
        const itemCategoryIdStr = item.category._id.toString();
        // Kiểm tra xem ID của category hoặc bất kỳ tổ tiên nào của nó có nằm trong danh sách được áp dụng không
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

    // Nếu không có sản phẩm nào được chọn phù hợp với coupon
    if (applicableItems.length === 0) return 0;

    // Tính tổng tiền của các sản phẩm được coupon áp dụng
    const applicableSubtotal = applicableItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    // Kiểm tra điều kiện giá trị đơn hàng tối thiểu
    const minOrderValue = coupon.minOrderValue || 0;
    if (minOrderValue > 0 && applicableSubtotal < minOrderValue) {
      return 0;
    }

    // Tính toán số tiền giảm giá
    let calculatedDiscount = 0;
    const discountValue = coupon.discountValue || 0;
    if (coupon.discountType === "percentage") {
      calculatedDiscount = (applicableSubtotal * discountValue) / 100;
    } else if (coupon.discountType === "fixed_amount") {
      calculatedDiscount = discountValue;
    }

    // Giảm giá không thể lớn hơn tổng tiền của các sản phẩm được áp dụng
    return Math.min(Math.round(calculatedDiscount), applicableSubtotal);
  }, [
    originalCart.appliedCoupon,
    selectedItemsForSummary,
    categoryMap,
    getAncestorsFn,
  ]);

  // 4. Tính tổng tiền cuối cùng
  const finalTotalForSelected = selectedSubtotal - discountAmountForSelected;

  // --- Logic và Handlers ---
  const canProceedToCheckout = selectedItemsForSummary.length > 0;

  const handleProceedToCheckout = () => {
    if (!canProceedToCheckout) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để tiếp tục.");
      return;
    }

    // Lấy ID của các cart items đã được chọn và lưu vào Redux store
    const selectedIds = selectedItemsForSummary.map((item) => item._id);
    dispatch(setSelectedItemsForCheckout(selectedIds));
    router.push("/checkout"); // Điều hướng sang trang thanh toán
  };

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
            Tạm tính ({numberOfSelectedProductLines} loại,{" "}
            {totalSelectedQuantity} sản phẩm)
          </dt>
          <dd className="text-sm font-medium text-gray-900">
            {formatCurrency(selectedSubtotal)}
          </dd>
        </div>

        {/* Component Coupon nhận các props cần thiết để hoạt động độc lập */}
        <CouponSection
          cartSubtotal={selectedSubtotal}
          appliedCouponFull={originalCart.appliedCoupon}
          selectedItems={selectedItemsForSummary}
          categoryMap={categoryMap}
          getAncestorsFn={getAncestorsFn}
        />

        {/* Hiển thị số tiền được giảm nếu có */}
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

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <dt className="text-base font-semibold text-gray-900">Tổng cộng</dt>
          <dd className="text-base font-semibold text-gray-900">
            {formatCurrency(finalTotalForSelected)}
          </dd>
        </div>
      </dl>

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
          aria-disabled={!canProceedToCheckout}
        >
          Tiến hành đặt hàng ({totalSelectedQuantity})
        </button>
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
