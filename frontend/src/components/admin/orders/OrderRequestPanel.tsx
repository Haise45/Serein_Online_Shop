"use client";

import ConfirmationModal from "@/components/shared/ConfirmationModal";
import {
  useApproveRequestAdmin,
  useRejectRequestAdmin,
} from "@/lib/react-query/orderQueries";
import { Order } from "@/types";
import { cilInfo, cilThumbDown, cilThumbUp } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";
import Image from "next/image";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface OrderRequestPanelProps {
  order: Order;
}

const OrderRequestPanel: React.FC<OrderRequestPanelProps> = ({ order }) => {
  const t = useTranslations("AdminOrderDetail.requestPanel");
  const tShared = useTranslations("Shared.confirmModal");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isConfirmApproveModalOpen, setIsConfirmApproveModalOpen] =
    useState(false);

  const approveMutation = useApproveRequestAdmin();
  const rejectMutation = useRejectRequestAdmin();

  // Xác định loại yêu cầu hiện tại và dữ liệu tương ứng
  const requestType =
    order.status === "CancellationRequested" ? "cancellation" : "refund";
  const requestData =
    order.status === "CancellationRequested"
      ? order.cancellationRequest
      : order.refundRequest;

  if (!requestData) {
    return null; // Không hiển thị gì nếu không có yêu cầu
  }

  const handleApprove = () => {
    approveMutation.mutate({ orderId: order._id, type: requestType });
    setIsConfirmApproveModalOpen(false);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      // Có thể thêm toast error ở đây nếu muốn
      return;
    }
    rejectMutation.mutate({
      orderId: order._id,
      type: requestType,
      payload: { reason: rejectReason },
    });
    setIsRejectModalOpen(false);
  };

  const requestTitle = t(
    requestType === "cancellation" ? "cancelTitle" : "refundTitle",
  );
  const requestTypeName = t(`requestType_${requestType}` as string);

  return (
    <>
      <div className="rounded-lg border-2 border-dashed border-red-400 bg-red-50 p-6">
        <h3 className="mb-4 flex items-center text-xl font-bold text-red-700">
          <CIcon icon={cilInfo} className="mr-3 h-6 w-6" />
          {requestTitle}
        </h3>

        <div className="space-y-4">
          <div>
            <p className="font-semibold text-gray-700">{t("customerReason")}</p>
            <p className="mt-1 rounded-md border bg-white p-3 text-gray-800">
              {requestData.reason}
            </p>
          </div>

          {requestData.imageUrls && requestData.imageUrls.length > 0 && (
            <div>
              <p className="mb-2 font-semibold text-gray-700">
                {t("attachedImages")}
              </p>
              <div className="flex flex-wrap gap-4">
                {requestData.imageUrls.map((url, index) => (
                  <Link
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image
                      src={url}
                      alt={t("imageProof", { index: index + 1 })}
                      width={100}
                      height={100}
                      className="rounded-lg border-2 border-white object-cover shadow-md transition-opacity hover:opacity-80"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-red-200 pt-4">
          <CButton
            color="danger"
            variant="outline"
            onClick={() => setIsRejectModalOpen(true)}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            <CIcon icon={cilThumbDown} className="me-2" />
            {t("reject")}
          </CButton>
          <CButton
            color="success"
            onClick={() => setIsConfirmApproveModalOpen(true)}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            <CIcon icon={cilThumbUp} className="me-2" />
            {t("approve")}
          </CButton>
        </div>
      </div>

      {/* Modal để xác nhận Chấp nhận */}
      <ConfirmationModal
        visible={isConfirmApproveModalOpen}
        onClose={() => setIsConfirmApproveModalOpen(false)}
        onConfirm={handleApprove}
        isConfirming={approveMutation.isPending}
        title={t("confirmApproveTitle")}
        body={t("confirmApproveBody", { type: requestTypeName })}
        confirmButtonText={tShared("confirm")}
        cancelButtonText={tShared("cancel")}
        confirmButtonColor="success"
      />

      {/* Modal để nhập lý do Từ chối */}
      <CModal
        visible={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>{t("rejectModalTitle")}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">{t("rejectModalBody")}</p>
          <CFormTextarea
            rows={4}
            placeholder={t("rejectModalPlaceholder")}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setIsRejectModalOpen(false)}
          >
            {tShared("cancel")}
          </CButton>
          <CButton
            color="danger"
            onClick={handleReject}
            disabled={!rejectReason.trim() || rejectMutation.isPending}
          >
            {rejectMutation.isPending
              ? tShared("processing")
              : t("rejectModalConfirm")}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default OrderRequestPanel;
