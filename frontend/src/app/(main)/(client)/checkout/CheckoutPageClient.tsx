"use client";

import CheckoutForm from "@/components/client/checkout/CheckoutForm";
import CheckoutOrderSummary from "@/components/client/checkout/CheckoutOrderSummary";
import { useGetCart } from "@/lib/react-query/cartQueries";
import { useCreateOrder } from "@/lib/react-query/orderQueries";
import { useGetUserAddresses } from "@/lib/react-query/userQueries";
import { getAllCategories } from "@/services/categoryService";
import { AppDispatch, RootState } from "@/store";
import {
  clearSelectedItemsForCheckout,
  setSelectedItemsForCheckout,
} from "@/store/slices/checkoutSlice";
import { Category } from "@/types/category";
import { Coupon } from "@/types/coupon";
import { OrderCreationPayload } from "@/types/order";
import { User } from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiLoader } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";

export default function CheckoutPageClient() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );

  // Lấy selected IDs từ Redux store
  const selectedIdsFromRedux = useSelector(
    (state: RootState) => state.checkout.selectedItemIdsForCheckout,
  );

  // State selectedCartItemIds giờ được khởi tạo từ Redux
  const [selectedCartItemIds, setSelectedCartItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [orderJustPlaced, setOrderJustPlaced] = useState<boolean>(false);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  useEffect(() => {
    // Đồng bộ từ Redux
    const newSet = new Set(selectedIdsFromRedux || []);
    if (
      newSet.size !== selectedCartItemIds.size ||
      !Array.from(newSet).every((id) => selectedCartItemIds.has(id))
    ) {
      setSelectedCartItemIds(newSet);
    }
  }, [selectedCartItemIds, selectedIdsFromRedux]);

  const {
    data: fullCart,
    isLoading: isLoadingCart,
    isError: isCartError,
    error: cartError,
  } = useGetCart();
  const { data: userAddresses, isLoading: isLoadingUserAddresses } =
    useGetUserAddresses({ enabled: isAuthenticated });
  const createOrderMutation = useCreateOrder();

  // Fetch categories để tính toán lại discount cho selected items nếu cần
  const { data: allActiveCategories, isLoading: isLoadingCategories } =
    useQuery<Category[], Error>({
      queryKey: ["allActiveCategoriesForCheckoutSummary"],
      queryFn: () => getAllCategories({ isActive: true }),
      staleTime: 1000 * 60 * 60, // Cache 1 giờ
    });

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    if (allActiveCategories) {
      allActiveCategories.forEach((cat) => map.set(cat._id.toString(), cat));
    }
    return map;
  }, [allActiveCategories]);

  const getAncestorsFn = useCallback(
    (categoryId: string, catMap: Map<string, Category>): string[] => {
      if (!categoryId) return [];
      const ancestors = [];
      let currentId = categoryId;
      for (let i = 0; i < 10 && currentId; i++) {
        const category = catMap.get(currentId);
        if (category && category.parent) {
          const parentId =
            typeof category.parent === "string"
              ? category.parent
              : category.parent._id.toString();
          if (parentId) {
            ancestors.push(parentId);
            currentId = parentId;
          } else {
            currentId = "";
          }
        } else {
          currentId = "";
        }
      }
      return ancestors;
    },
    [],
  );

  // Effect 1: Khởi tạo và đồng bộ selectedCartItemIds với Redux hoặc chọn tất cả
  useEffect(() => {
    if (isLoadingCart || !fullCart) return; // Đợi fullCart có dữ liệu

    let newSelectedIdsSet: Set<string>;

    if (selectedIdsFromRedux && selectedIdsFromRedux.length > 0) {
      // Ưu tiên lựa chọn từ Redux (ví dụ: đến từ trang Cart có checkbox)
      newSelectedIdsSet = new Set(selectedIdsFromRedux);
    } else if (fullCart.items.length > 0) {
      // Nếu Redux rỗng nhưng giỏ hàng có items -> Mặc định chọn tất cả
      // (Xử lý trường hợp điều hướng từ CartPreviewModal hoặc truy cập trực tiếp)
      newSelectedIdsSet = new Set(fullCart.items.map((item) => item._id));
      dispatch(setSelectedItemsForCheckout(Array.from(newSelectedIdsSet))); // Cập nhật lại Redux
    } else {
      // Giỏ hàng rỗng
      newSelectedIdsSet = new Set();
    }

    // Chỉ cập nhật state nếu thực sự có thay đổi để tránh re-render vô ích
    if (
      newSelectedIdsSet.size !== selectedCartItemIds.size ||
      !Array.from(newSelectedIdsSet).every((id) => selectedCartItemIds.has(id))
    ) {
      setSelectedCartItemIds(newSelectedIdsSet);
    }
    setHasInitializedSelection(true); // Đánh dấu đã khởi tạo/đồng bộ xong
  }, [
    fullCart,
    selectedIdsFromRedux,
    isLoadingCart,
    dispatch,
    selectedCartItemIds,
  ]);

  const itemsToCheckout = useMemo(() => {
    if (!fullCart || selectedCartItemIds.size === 0) return [];
    return fullCart.items.filter((item) => selectedCartItemIds.has(item._id));
  }, [fullCart, selectedCartItemIds]);

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

    if (fullCart?.appliedCoupon) {
      const coupon = fullCart.appliedCoupon; // Đây là object Coupon đầy đủ
      currentAppliedCoupon = coupon; // Gán coupon hiện tại
      let applicableSubtotalForCheckoutItems = 0;
      let foundApplicableItem = false;

      const trulyApplicableItems = itemsToCheckout.filter((item) => {
        if (!coupon || !coupon.applicableIds)
          return coupon.applicableTo === "all";
        const itemProductIdStr =
          typeof item.productId === "string"
            ? item.productId
            : item.productId._id.toString();
        if (coupon.applicableTo === "all") return true;
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
          return false;
        }
        return false;
      });

      if (trulyApplicableItems.length > 0) {
        foundApplicableItem = true;
        applicableSubtotalForCheckoutItems = trulyApplicableItems.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );
      }

      if (
        foundApplicableItem &&
        applicableSubtotalForCheckoutItems >= (coupon.minOrderValue || 0)
      ) {
        if (coupon.discountType === "percentage") {
          discount =
            (applicableSubtotalForCheckoutItems * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }
        discount = Math.min(
          Math.round(discount),
          applicableSubtotalForCheckoutItems,
        );
      } else {
        currentAppliedCoupon = null; // Coupon không áp dụng được cho các item đã chọn
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
  }, [itemsToCheckout, fullCart?.appliedCoupon, categoryMap, getAncestorsFn]);

  useEffect(() => {
    // Chờ các query và việc khởi tạo selection hoàn tất
    if (
      orderJustPlaced ||
      isLoadingCart ||
      isCartError ||
      isLoadingCategories ||
      !hasInitializedSelection
    ) {
      return;
    }

    // Nếu sau tất cả, không có item nào được chọn hoặc giỏ hàng trống
    if (selectedCartItemIds.size === 0) {
      if (fullCart && fullCart.items.length > 0) {
        // Giỏ hàng có đồ, nhưng không có gì được chọn (có thể do logic khởi tạo chưa đúng)
        toast("Vui lòng chọn sản phẩm từ giỏ hàng để thanh toán.", {
          id: "checkout-no-selection",
        });
      } else {
        // Giỏ hàng thực sự trống
        toast("Giỏ hàng của bạn trống.", { id: "checkout-empty-final" });
      }
      router.push("/cart");
    } else if (itemsToCheckout.length === 0 && selectedCartItemIds.size > 0) {
      // Có ID được chọn (trong Redux/state), nhưng không tìm thấy item tương ứng trong giỏ hàng thực tế
      toast.error(
        "Một số sản phẩm bạn chọn không còn khả dụng. Vui lòng kiểm tra lại giỏ hàng.",
        { id: "checkout-stale-items" },
      );
      router.push("/cart");
      dispatch(clearSelectedItemsForCheckout());
    }
  }, [
    orderJustPlaced,
    isLoadingCart,
    isCartError,
    isLoadingCategories,
    hasInitializedSelection,
    itemsToCheckout.length,
    selectedCartItemIds.size,
    fullCart,
    router,
    dispatch,
  ]);

  const handlePlaceOrder = async (
    formData: Omit<OrderCreationPayload, "selectedCartItemIds">,
  ) => {
    if (itemsToCheckout.length === 0 || selectedCartItemIds.size === 0) {
      toast.error("Không có sản phẩm nào được chọn để đặt hàng.");
      return;
    }

    const finalPayload: OrderCreationPayload = {
      ...formData,
      selectedCartItemIds: Array.from(selectedCartItemIds), // Lấy từ state
    };

    createOrderMutation.mutate(finalPayload, {
      onSuccess: (createdOrder) => {
        setOrderJustPlaced(true);
        dispatch(clearSelectedItemsForCheckout()); // Xóa selected items khỏi Redux sau khi đặt hàng thành công
        if (
          createdOrder.user &&
          typeof createdOrder.user === "object" &&
          createdOrder.user._id
        ) {
          // User đã đăng nhập và có thông tin user đầy đủ
          router.push(`/profile/orders/${createdOrder._id}`);
        } else if (!createdOrder.user && createdOrder.guestOrderTrackingToken) {
          // Guest order và có tracking token
          router.push(
            `/track-order/${createdOrder._id}/${createdOrder.guestOrderTrackingToken}`,
          );
        } else {
          router.push(`/order-success?orderId=${createdOrder._id}`);
        }
      },
      onError: (error) => {
        // Nếu API tạo đơn hàng lỗi, reset cờ
        setOrderJustPlaced(false);
        // Toast lỗi đã được xử lý trong useCreateOrder hook
        toast.error(
          error.message || "Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.",
        );
      },
    });
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

  if (
    isLoadingCart ||
    (isAuthenticated && isLoadingUserAddresses) ||
    isLoadingCategories
  ) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <FiLoader className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isCartError) {
    return (
      <div className="py-20 text-center text-red-600">
        Lỗi tải giỏ hàng: {cartError?.message}
      </div>
    );
  }

  if (
    !orderJustPlaced &&
    (selectedCartItemIds.size === 0 ||
      (itemsToCheckout.length === 0 && selectedCartItemIds.size > 0))
  ) {
    if (!isLoadingCart && !isCartError && !isLoadingCategories) {
      return (
        <div className="py-20 text-center">
          Đang xử lý hoặc không có sản phẩm nào được chọn. Vui lòng đợi hoặc
          quay lại giỏ hàng.
        </div>
      );
    }
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <FiLoader className="h-12 w-12 animate-spin text-indigo-600" />
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
            user={user as User | null} // Cast user từ authSlice
            userAddresses={userAddresses || []}
            isLoadingAddresses={isLoadingUserAddresses}
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
            onPlaceOrderTriggerFromSummary={handleTriggerFormSubmit}
          />
        </div>
      </div>
    </div>
  );
}
