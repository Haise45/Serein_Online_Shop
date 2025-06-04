"use client";
import { formatCurrency } from "@/lib/utils";
import { AppDispatch } from "@/store"; // Import AppDispatch
import { setSelectedItemsForCheckout } from "@/store/slices/checkoutSlice";
import { CartData, CartItem as CartItemType } from "@/types/cart";
import { Category } from "@/types/category";
import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux"; // Import useDispatch
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
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  // Tính toán lại subtotal và totalQuantity DỰA TRÊN selectedItemsForSummary
  const selectedSubtotal = useMemo(() => {
    return selectedItemsForSummary.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
  }, [selectedItemsForSummary]);

  const numberOfSelectedProductLines = selectedItemsForSummary.length;
  // Tính tổng số lượng sản phẩm thực tế được chọn
  const totalSelectedQuantity = useMemo(() => {
    return selectedItemsForSummary.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );
  }, [selectedItemsForSummary]);

  // Tính toán discountAmount CHỈ cho các selectedItemsForSummary
  // dựa trên coupon đã được áp dụng cho originalCart.
  const discountAmountForSelected = useMemo(() => {
    if (!originalCart.appliedCoupon || selectedItemsForSummary.length === 0) {
      return 0;
    }

    const coupon = originalCart.appliedCoupon; // Giả sử đây là type Coupon đầy đủ
    let applicableSubtotalForSelectedItems = 0;

    // Lọc ra những item trong selectedItemsForSummary thực sự được coupon này áp dụng
    const trulyApplicableItems = selectedItemsForSummary.filter((item) => {
      if (!coupon || !coupon.applicableIds)
        return coupon.applicableTo === "all";

      const itemProductIdStr =
        typeof item.productId === "string"
          ? item.productId
          : item.productId._id.toString();

      if (coupon.applicableTo === "all") {
        return true;
      }

      if (coupon.applicableTo === "products") {
        return coupon.applicableIds.some(
          (appId) => appId.toString() === itemProductIdStr,
        );
      }

      if (coupon.applicableTo === "categories") {
        if (
          item.category &&
          typeof item.category !== "string" &&
          item.category._id
        ) {
          const itemCategoryIdStr = item.category._id.toString();
          const itemCategoryAndItsAncestors = new Set([
            itemCategoryIdStr,
            ...getAncestorsFn(itemCategoryIdStr, categoryMap),
          ]);
          return coupon.applicableIds.some((appId) =>
            itemCategoryAndItsAncestors.has(appId.toString()),
          );
        }
        return false; // Item không có category hợp lệ
      }
      return false; // Mặc định không áp dụng nếu applicableTo không khớp
    });

    if (trulyApplicableItems.length === 0) {
      return 0; // Không có sản phẩm nào được chọn phù hợp với coupon này
    }

    applicableSubtotalForSelectedItems = trulyApplicableItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Kiểm tra minOrderValue với applicableSubtotalForSelectedItems (tổng tiền của các sản phẩm thực sự được coupon áp dụng)
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
      applicableSubtotalForSelectedItems, // Giảm giá không thể lớn hơn tổng tiền của các sản phẩm được áp dụng
    );
  }, [
    originalCart.appliedCoupon,
    selectedItemsForSummary,
    categoryMap,
    getAncestorsFn,
  ]);

  const finalTotalForSelected = selectedSubtotal - discountAmountForSelected;

  const canProceedToCheckout = selectedItemsForSummary.length > 0;

  const handleProceedToCheckout = () => {
    // Đổi thành hàm xử lý onClick
    if (!canProceedToCheckout) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để tiếp tục.");
      return;
    }

    const selectedIds = selectedItemsForSummary.map((item) => item._id);
    if (selectedIds.length > 0) {
      dispatch(setSelectedItemsForCheckout(selectedIds));
      router.push("/checkout"); // Điều hướng không cần query params
    } else {
      toast.error("Vui lòng chọn sản phẩm để thanh toán."); // Trường hợp này ít xảy ra nếu canProceedToCheckout đã check
    }
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
            Sản phẩm đã chọn ({numberOfSelectedProductLines} loại -{" "}
            {totalSelectedQuantity} chiếc)
          </dt>
          <dd className="text-sm font-medium text-gray-900">
            {formatCurrency(selectedSubtotal)}
          </dd>
        </div>

        {/* Truyền selectedSubtotal để CouponSection có thể kiểm tra minOrderValue cho các coupon */}
        <CouponSection
          cartSubtotal={selectedSubtotal}
          appliedCouponFull={originalCart.appliedCoupon}
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
        <button
          type="button"
          onClick={handleProceedToCheckout} // Gọi hàm mới
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
