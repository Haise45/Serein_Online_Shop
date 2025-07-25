"use client";

import { useSettings } from "@/app/SettingsContext";
import OrderCustomerInfo from "@/components/admin/orders/OrderCustomerInfo";
import OrderDetailHeader from "@/components/admin/orders/OrderDetailHeader";
import OrderItemsTable from "@/components/admin/orders/OrderItemsTable";
import OrderRequestPanel from "@/components/admin/orders/OrderRequestPanel";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import {
  useGetOrderById,
  useRestockOrderItemsAdmin,
} from "@/lib/react-query/orderQueries";
import { formatCurrency } from "@/lib/utils";
import { cilCreditCard, cilInfo, cilPrint, cilTruck } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from "@coreui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface AdminOrderDetailClientProps {
  orderId: string;
}

const AdminOrderDetailClient: React.FC<AdminOrderDetailClientProps> = ({
  orderId,
}) => {
  const t = useTranslations("AdminOrderDetail");
  const tShared = useTranslations("Shared.confirmModal");
  const tPayment = useTranslations("CheckoutForm.paymentMethods");
  const router = useRouter();
  // *** SỬ DỤNG CONTEXT ĐỂ LẤY THÔNG TIN TIỀN TỆ ***
  const { displayCurrency, rates } = useSettings();
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const restockMutation = useRestockOrderItemsAdmin();
  const searchParams = useSearchParams();

  const {
    data: order,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetOrderById(orderId);

  // *** XÁC ĐỊNH XEM CÓ YÊU CẦU ĐANG CHỜ XỬ LÝ KHÔNG ***
  const hasPendingRequest = [
    "CancellationRequested",
    "RefundRequested",
  ].includes(order?.status || "");

  const paymentMethodLabel = order?.paymentMethod
    ? tPayment(`${order.paymentMethod}.name`)
    : "";

  const backLink = `/admin/orders?${searchParams.toString()}`;

  const handleConfirmRestock = () => {
    restockMutation.mutate(orderId, {
      onSuccess: () => {
        setIsRestockModalOpen(false);
      },
    });
  };

  const handlePrintOrder = () => {
    const printUrl = `/admin/orders/${orderId}/print`;
    window.open(printUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center">
        <CSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 text-center text-red-600">
        <p>{t("loadingError", { error: error?.message })}</p>
        <CButton color="primary" onClick={() => refetch()} className="mt-3">
          {t("retry")}
        </CButton>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-10 text-center text-gray-600">{t("notFound")}</div>
    );
  }

  return (
    <div className="space-y-6">
      <CButton
        color="secondary"
        variant="outline"
        onClick={() => router.push(backLink)}
        style={{ marginBottom: "20px" }}
      >
        {t("backToList")}
      </CButton>

      {hasPendingRequest && order && <OrderRequestPanel order={order} />}

      <CCard className="shadow-sm">
        <CCardHeader className="bg-white !p-4">
          <OrderDetailHeader
            order={order}
            onRestockClick={() => setIsRestockModalOpen(true)}
            isRestocking={restockMutation.isPending}
          />
        </CCardHeader>
        <CCardBody className="!p-4 md:!p-6">
          <CRow>
            <CCol lg={8}>
              <div className="space-y-8">
                {/* Bảng sản phẩm */}
                <section>
                  <h3 className="mb-3 text-lg font-semibold text-gray-800">
                    {t("itemsInOrder")}
                  </h3>
                  <OrderItemsTable items={order.orderItems} />
                </section>

                {/* Thông tin khách hàng và địa chỉ */}
                <section>
                  <OrderCustomerInfo order={order} />
                </section>
              </div>
            </CCol>

            <CCol lg={4} className="mt-6 lg:mt-0">
              <div className="sticky top-20 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="border-b pb-3 text-lg font-semibold text-gray-800">
                  {t("financialSummary.title")}
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt>{t("financialSummary.subtotal")}</dt>
                    <dd>
                      {formatCurrency(order.itemsPrice, {
                        currency: displayCurrency,
                        rates,
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <dt>{t("financialSummary.discount")}</dt>
                    <dd>
                      -
                      {formatCurrency(order.discountAmount, {
                        currency: displayCurrency,
                        rates,
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("financialSummary.shippingFee")}</dt>
                    <dd>
                      {formatCurrency(order.shippingPrice, {
                        currency: displayCurrency,
                        rates,
                      })}
                    </dd>
                  </div>
                  <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                    <dt>{t("financialSummary.total")}</dt>
                    <dd>
                      {formatCurrency(order.totalPrice, {
                        currency: displayCurrency,
                        rates,
                      })}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center text-sm">
                    <CIcon
                      icon={cilCreditCard}
                      className="mr-2 h-4 w-4 text-gray-500"
                    />
                    <span>
                      {t.rich("paymentInfo.method", {
                        method: paymentMethodLabel,
                        bold: (chunks) => (
                          <span className="font-semibold text-gray-800">
                            {chunks}
                          </span>
                        ),
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CIcon
                      icon={cilTruck}
                      className="mr-2 h-4 w-4 text-gray-500"
                    />
                    <span>
                      {t.rich("paymentInfo.shipping", {
                        method: order.shippingMethod ?? "N/A",
                        bold: (chunks) => (
                          <span className="font-semibold text-gray-800">
                            {chunks}
                          </span>
                        ),
                      })}
                    </span>
                  </div>
                  {order.notes && (
                    <div className="flex items-start text-sm">
                      <CIcon
                        icon={cilInfo}
                        className="mt-0.5 mr-2 h-4 w-4 text-gray-500"
                      />
                      <span className="flex-1">
                        {t.rich("paymentInfo.notes", {
                          notes: order.notes || "",
                          italic: (chunks) => (
                            <span className="text-gray-600 italic">
                              {chunks}
                            </span>
                          ),
                        })}
                      </span>
                    </div>
                  )}
                </div>
                {order.isPaid && order.paymentResult && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-2 text-xs">
                    <p className="font-semibold text-green-800">
                      {t("paymentInfo.paymentDetails")}
                    </p>
                    <p className="break-all">
                      <strong>{t("paymentInfo.transactionId")}</strong>{" "}
                      {order.paymentResult.id}
                    </p>
                    <p>
                      <strong>{t("paymentInfo.status")}</strong>{" "}
                      {order.paymentResult.status}
                    </p>
                    {order.paymentResult.captureId && (
                      <p>
                        <strong>{t("paymentInfo.captureId")}</strong>{" "}
                        {order.paymentResult.captureId}
                      </p>
                    )}
                  </div>
                )}
                <div className="border-t pt-4">
                  <CButton
                    color="secondary"
                    variant="outline"
                    className="w-full"
                    onClick={handlePrintOrder}
                  >
                    <CIcon icon={cilPrint} className="mr-2" />
                    {t("printOrder")}
                  </CButton>
                </div>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* *** MODAL XÁC NHẬN RESTOCK *** */}
      <ConfirmationModal
        visible={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        onConfirm={handleConfirmRestock}
        isConfirming={restockMutation.isPending}
        title={t("restockModal.title")}
        body={t.rich("restockModal.body", {
          id: orderId.slice(-6).toUpperCase(),
          bold: (chunks) => (
            <span className="font-semibold text-indigo-600">{chunks}</span>
          ),
        })}
        confirmButtonText={tShared("confirm")}
        cancelButtonText={tShared("cancel")}
      />
    </div>
  );
};

export default AdminOrderDetailClient;
