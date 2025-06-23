"use client";

import CheckoutForm, {
  PAYMENT_METHODS,
} from "@/components/client/checkout/CheckoutForm";
import CheckoutOrderSummary from "@/components/client/checkout/CheckoutOrderSummary";
import { useGetAttributes } from "@/lib/react-query/attributeQueries";
import { useGetCart } from "@/lib/react-query/cartQueries";
import { useCreateOrder } from "@/lib/react-query/orderQueries";
import { useGetUserAddresses } from "@/lib/react-query/userQueries";
import { AppDispatch, RootState } from "@/store";
import { clearSelectedItemsForCheckout } from "@/store/slices/checkoutSlice";
import { Attribute, Category, Coupon } from "@/types";
import { OrderCreationPayload } from "@/types/order";
import { User } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";

// Helper Function: Lấy tổ tiên của category
const getAncestors = (
  categoryId: string,
  categoryMap: Map<string, Category>,
): string[] => {
  const ancestors: string[] = [];
  let currentId: string | null = categoryId;
  for (let i = 0; i < 10; i++) {
    // Giới hạn vòng lặp để tránh vô hạn
    const category = categoryMap.get(currentId!);
    if (category?.parent) {
      const parentId =
        typeof category.parent === "string"
          ? category.parent
          : category.parent._id;
      ancestors.push(parentId);
      currentId = parentId;
    } else {
      break;
    }
  }
  return ancestors;
};

export default function CheckoutPageClient() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // --- STATE AND SELECTORS ---
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );
  const selectedCartItemIds = useSelector(
    (state: RootState) => state.checkout.selectedItemIdsForCheckout,
  );
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);

  // --- DATA FETCHING ---
  const {
    data: fullCart,
    isLoading: isLoadingCart,
    isError: isCartError,
    error: cartError,
  } = useGetCart();

  const { data: userAddresses, isLoading: isLoadingUserAddresses } =
    useGetUserAddresses({ enabled: isAuthenticated });

  // Dùng query này để xây dựng categoryMap, cần cho việc tính toán coupon
  const { data: allCategories, isLoading: isLoadingCategories } = useQuery<
    { categories: Category[] },
    Error
  >({
    queryKey: ["allActiveCategoriesForCheckout"],
    queryFn: () =>
      import("@/services/categoryService").then((mod) =>
        mod.getAllCategories({ isActive: true, limit: 1000 }),
      ),
    staleTime: 1000 * 60 * 60,
  });
  const { data: allAttributes, isLoading: isLoadingAttributes } =
    useGetAttributes();

  // --- MEMOIZED VALUES ---
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    if (allCategories?.categories) {
      allCategories.categories.forEach((cat) =>
        map.set(cat._id.toString(), cat),
      );
    }
    return map;
  }, [allCategories]);

  const attributeMap = useMemo(() => {
    const map = new Map<
      string,
      { label: string; values: Map<string, string> }
    >();
    if (allAttributes) {
      allAttributes.forEach((attr: Attribute) => {
        const valueMap = new Map<string, string>();
        attr.values.forEach((val) => valueMap.set(val._id, val.value));
        map.set(attr._id, { label: attr.label, values: valueMap });
      });
    }
    return map;
  }, [allAttributes]);

  // --- DERIVED STATE (Trạng thái được tính toán) ---
  const itemsToCheckout = useMemo(() => {
    if (!fullCart || !selectedCartItemIds) return [];
    const selectedIdsSet = new Set(selectedCartItemIds);
    return fullCart.items.filter((item) => selectedIdsSet.has(item._id));
  }, [fullCart, selectedCartItemIds]);

  const stockErrorInCheckout = useMemo(() => {
    for (const item of itemsToCheckout) {
      if (item.quantity > item.availableStock) {
        return `Sản phẩm "${item.name}" không đủ tồn kho (còn ${item.availableStock}).`;
      }
    }
    return null;
  }, [itemsToCheckout]);

  const orderSummaryValues = useMemo(() => {
    if (itemsToCheckout.length === 0) {
      return {
        subtotal: 0,
        discount: 0,
        finalTotal: 0,
        totalQuantity: 0,
        appliedCoupon: null,
      };
    }
    const subtotal = itemsToCheckout.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const totalQuantity = itemsToCheckout.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );
    let discount = 0;
    let currentAppliedCoupon: Coupon | null = null;

    // Sử dụng optional chaining và nullish coalescing để kiểm tra an toàn
    if (fullCart?.appliedCoupon?.code) {
      const coupon = fullCart.appliedCoupon;
      currentAppliedCoupon = coupon as Coupon;

      const trulyApplicableItems = itemsToCheckout.filter((item) => {
        if (coupon.applicableTo === "all") return true;
        if (!coupon.applicableIds?.length) return false;

        const itemProductIdStr =
          typeof item.productId === "string"
            ? item.productId
            : item.productId._id;

        if (coupon.applicableTo === "products") {
          return coupon.applicableIds.includes(itemProductIdStr);
        }
        if (coupon.applicableTo === "categories" && item.category?._id) {
          const itemCategoryAndAncestors = new Set([
            item.category._id,
            ...getAncestors(item.category._id, categoryMap),
          ]);
          return coupon.applicableIds.some((appId) =>
            itemCategoryAndAncestors.has(appId),
          );
        }
        return false;
      });

      if (trulyApplicableItems.length > 0) {
        const applicableSubtotal = trulyApplicableItems.reduce(
          (sum, i) => sum + i.lineTotal,
          0,
        );

        // Cung cấp giá trị mặc định cho các trường optional
        const minOrderValue = coupon.minOrderValue ?? 0;
        const discountValue = coupon.discountValue ?? 0;

        if (applicableSubtotal >= minOrderValue) {
          discount =
            coupon.discountType === "percentage"
              ? (applicableSubtotal * discountValue) / 100
              : discountValue;

          discount = Math.min(Math.round(discount), applicableSubtotal);
        } else {
          currentAppliedCoupon = null; // Không đủ điều kiện minOrderValue
        }
      } else {
        currentAppliedCoupon = null; // Không có sản phẩm nào áp dụng được
      }
    }
    const finalTotal = subtotal - discount;
    return {
      subtotal,
      discount,
      finalTotal,
      totalQuantity,
      appliedCoupon: currentAppliedCoupon,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsToCheckout, fullCart?.appliedCoupon, categoryMap, getAncestors]);

  // --- MUTATIONS ---
  const createOrderMutation = useCreateOrder({
    onSuccess: (createdOrder) => {
      setIsRedirecting(true);
      dispatch(clearSelectedItemsForCheckout());

      const successRoute = createdOrder.user
        ? `/profile/orders/${createdOrder._id}`
        : createdOrder.guestOrderTrackingToken
          ? `/track-order/${createdOrder._id}/${createdOrder.guestOrderTrackingToken}`
          : `/order-success?orderId=${createdOrder._id}`;

      router.push(successRoute);
    },
  });

  // --- SIDE EFFECTS ---
  useEffect(() => {
    // Chỉ chạy logic này khi các query đã hoàn tất và chưa có lệnh chuyển hướng nào
    if (isLoadingCart || isLoadingCategories || isRedirecting) {
      return;
    }

    // Nếu load xong mà giỏ hàng không tồn tại, hoặc không có item nào được chọn từ trước
    if (!fullCart || selectedCartItemIds.length === 0) {
      toast.error("Vui lòng chọn sản phẩm từ giỏ hàng để thanh toán.", {
        id: "checkout-no-selection",
      });
      router.replace("/cart");
      return;
    }

    // Nếu các ID được chọn không tìm thấy trong giỏ hàng thực tế (dữ liệu stale)
    if (itemsToCheckout.length !== selectedCartItemIds.length) {
      toast.error(
        "Một số sản phẩm đã thay đổi. Vui lòng kiểm tra lại giỏ hàng.",
        { id: "checkout-stale-items" },
      );
      router.replace("/cart");
      return;
    }

    // Nếu có lỗi tồn kho, chuyển người dùng về giỏ hàng để họ tự sửa
    if (stockErrorInCheckout) {
      toast.error(stockErrorInCheckout, { id: "checkout-stock-error" });
      router.replace("/cart");
    }
  }, [
    fullCart,
    itemsToCheckout.length,
    selectedCartItemIds.length,
    isLoadingCart,
    isLoadingCategories,
    isRedirecting,
    stockErrorInCheckout,
    router,
  ]);

  // --- HANDLERS ---
  const handlePlaceOrder = (
    formData: Omit<OrderCreationPayload, "selectedCartItemIds">,
  ) => {
    if (stockErrorInCheckout) {
      toast.error(stockErrorInCheckout);
      router.push("/cart");
      return;
    }
    if (itemsToCheckout.length === 0) {
      toast.error("Không có sản phẩm để đặt hàng.");
      return;
    }
    const finalPayload: OrderCreationPayload = {
      ...formData,
      paymentMethod,
      selectedCartItemIds: selectedCartItemIds, // Lấy từ Redux selector ở trên
    };
    createOrderMutation.mutate(finalPayload);
  };

  const handleTriggerFormSubmit = () => {
    const form = document.getElementById("checkout-form") as HTMLFormElement;
    if (form) {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true }),
        );
      }
    }
  };

  // --- RENDER LOGIC ---
  const isLoading =
    isLoadingCart ||
    (isAuthenticated && isLoadingUserAddresses) ||
    isLoadingCategories ||
    isLoadingAttributes;

  if (isLoading || isRedirecting) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <FiLoader className="h-12 w-12 animate-spin text-indigo-600" />
        {isRedirecting && (
          <p className="text-lg text-gray-700">Đang hoàn tất đơn hàng...</p>
        )}
      </div>
    );
  }

  if (isCartError) {
    return (
      <div className="my-20 flex flex-col items-center justify-center text-center">
        <FiAlertCircle className="h-12 w-12 text-red-400" />
        <p className="mt-4 text-lg font-semibold text-red-700">
          Lỗi tải giỏ hàng
        </p>
        <p className="mt-1 text-gray-600">
          {cartError?.message ||
            "Không thể lấy thông tin giỏ hàng để thanh toán."}
        </p>
      </div>
    );
  }

  // Nếu sau tất cả các kiểm tra, vẫn không có item nào (trường hợp hiếm)
  if (itemsToCheckout.length === 0) {
    // useEffect sẽ xử lý chuyển hướng, component này chỉ hiển thị trạng thái chờ
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <FiLoader className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-lg text-gray-700">Đang kiểm tra giỏ hàng...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900">
        Thông tin thanh toán
      </h1>
      <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <CheckoutForm
            user={user as User | null}
            userAddresses={userAddresses || []}
            isLoadingAddresses={isLoadingUserAddresses}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onSubmitOrder={handlePlaceOrder}
            isSubmittingOrder={createOrderMutation.isPending}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <CheckoutOrderSummary
            items={itemsToCheckout}
            subtotal={orderSummaryValues.subtotal}
            discount={orderSummaryValues.discount}
            appliedCouponFull={orderSummaryValues.appliedCoupon}
            shippingFee={0}
            finalTotal={orderSummaryValues.finalTotal}
            isPlacingOrder={createOrderMutation.isPending}
            paymentMethod={paymentMethod}
            onPlaceOrderTriggerFromSummary={handleTriggerFormSubmit}
            attributeMap={attributeMap}
            stockError={stockErrorInCheckout}
          />
        </div>
      </div>
    </div>
  );
}
