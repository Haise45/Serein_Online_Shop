"use client";

import {
  useCapturePayPalOrder,
  useCreateOrder,
  useCreatePayPalOrder,
} from "@/lib/react-query/orderQueries";
import { OrderCreationPayload } from "@/types";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { clearSelectedItemsForCheckout } from "@/store/slices/checkoutSlice";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface PayPalButtonsWrapperProps {
  // Dữ liệu form (địa chỉ, ghi chú,...) để tạo đơn hàng trong DB
  getFormData: () => Omit<OrderCreationPayload, "selectedCartItemIds"> | null;
  setIsProcessing: (isProcessing: boolean) => void;
}

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

const PayPalButtonsWrapper: React.FC<PayPalButtonsWrapperProps> = ({
  getFormData,
  setIsProcessing,
}) => {
  const t = useTranslations("PayPal");
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const selectedCartItemIds = useSelector(
    (state: RootState) => state.checkout.selectedItemIdsForCheckout,
  );

  const createOrderMutation = useCreateOrder();
  const createPayPalOrderMutation = useCreatePayPalOrder();
  const capturePayPalOrderMutation = useCapturePayPalOrder();

  const handleCreateOrder = async (): Promise<string> => {
    const formData = getFormData();
    if (!formData || !formData.shippingAddress) {
      toast.error(t("invalidFormError"));
      return Promise.reject(new Error("Thông tin giao hàng không hợp lệ."));
    }

    try {
      const { orderID } = await createPayPalOrderMutation.mutateAsync({
        selectedCartItemIds,
        shippingAddress: formData.shippingAddress, // Gửi địa chỉ lên
      });
      return orderID;
    } catch (error) {
      toast.error(t("createOrderError"));
      return Promise.reject(error);
    }
  };

  const handleOnApprove = async (data: { orderID: string }): Promise<void> => {
    setIsProcessing(true);

    try {
      const formData = getFormData();
      if (!formData) {
        // Toast đã được hiển thị bên trong getFormData
        throw new Error("Dữ liệu form không hợp lệ.");
      }

      // 1. Tạo đơn hàng trong DB của bạn trước
      const orderPayload: OrderCreationPayload = {
        ...formData,
        selectedCartItemIds,
      };
      // Sử dụng mutateAsync để có thể await và lấy kết quả
      const createdOrder = await createOrderMutation.mutateAsync(orderPayload);

      // 2. Capture thanh toán PayPal
      await capturePayPalOrderMutation.mutateAsync({
        orderId: createdOrder._id,
        paypalOrderId: data.orderID,
      });

      // 3. Dọn dẹp state và chuyển hướng
      dispatch(clearSelectedItemsForCheckout());

      // *** LOGIC CHUYỂN HƯỚNG ***
      let successRoute: string;

      if (createdOrder.user) {
        // Nếu là USER ĐÃ ĐĂNG NHẬP, chuyển đến trang chi tiết đơn hàng trong profile
        successRoute = `/profile/orders/${createdOrder._id}`;
      } else if (createdOrder.guestOrderTrackingToken) {
        // Nếu là GUEST và có tracking token, chuyển đến trang theo dõi đơn hàng
        successRoute = `/track-order/${createdOrder._id}/${createdOrder.guestOrderTrackingToken}`;
      } else {
        // Trường hợp dự phòng: chỉ hiển thị trang thành công chung
        successRoute = `/order-success?orderId=${createdOrder._id}`;
      }

      router.push(successRoute);
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || t("captureError"));
      setIsProcessing(false);
    }
  };

  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-center text-red-700">
        {t("configError")}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <PayPalScriptProvider
        options={{
          clientId: PAYPAL_CLIENT_ID,
          // Thêm các options để tránh positioning issues
          components: "buttons",
        }}
      >
        <div className="paypal-buttons-container relative z-10">
          <PayPalButtons
            style={{
              layout: "vertical",
              height: 50,
              tagline: false,
              shape: "rect",
              color: "gold",
            }}
            createOrder={handleCreateOrder}
            onApprove={handleOnApprove}
            onError={() => {
              toast.error(t("genericError"));
              setIsProcessing(false);
            }}
            // Thêm forceReRender để tránh caching issues
            forceReRender={[selectedCartItemIds]}
          />
        </div>
      </PayPalScriptProvider>

      <style jsx>{`
        .paypal-buttons-container {
          position: relative !important;
          z-index: 1;
        }

        .paypal-buttons-container :global(.paypal-buttons) {
          position: relative !important;
          z-index: 1 !important;
        }

        .paypal-buttons-container :global(.paypal-button) {
          position: relative !important;
          z-index: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default PayPalButtonsWrapper;
