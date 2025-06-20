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
import Link from "next/link";

interface OrderRequestPanelProps {
  order: Order;
}

const OrderRequestPanel: React.FC<OrderRequestPanelProps> = ({ order }) => {
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

  const requestTitle =
    requestType === "cancellation"
      ? "Yêu cầu Hủy Đơn hàng"
      : "Yêu cầu Trả hàng/Hoàn tiền";

  return (
    <>
      <div className="rounded-lg border-2 border-dashed border-red-400 bg-red-50 p-6">
        <h3 className="mb-4 flex items-center text-xl font-bold text-red-700">
          <CIcon icon={cilInfo} className="mr-3 h-6 w-6" />
          {requestTitle}
        </h3>

        <div className="space-y-4">
          <div>
            <p className="font-semibold text-gray-700">Lý do của khách hàng:</p>
            <p className="mt-1 rounded-md border bg-white p-3 text-gray-800">
              {requestData.reason}
            </p>
          </div>

          {requestData.imageUrls && requestData.imageUrls.length > 0 && (
            <div>
              <p className="mb-2 font-semibold text-gray-700">
                Hình ảnh đính kèm:
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
                      alt={`Ảnh bằng chứng ${index + 1}`}
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
            Từ chối
          </CButton>
          <CButton
            color="success"
            onClick={() => setIsConfirmApproveModalOpen(true)}
            disabled={approveMutation.isPending || rejectMutation.isPending}
          >
            <CIcon icon={cilThumbUp} className="me-2" />
            Chấp nhận
          </CButton>
        </div>
      </div>

      {/* Modal để xác nhận Chấp nhận */}
      <ConfirmationModal
        visible={isConfirmApproveModalOpen}
        onClose={() => setIsConfirmApproveModalOpen(false)}
        onConfirm={handleApprove}
        isConfirming={approveMutation.isPending}
        title={`Xác nhận Chấp nhận Yêu cầu`}
        body={`Bạn có chắc chắn muốn chấp nhận yêu cầu ${requestType === "cancellation" ? "hủy" : "hoàn tiền"} cho đơn hàng này? Hành động này không thể hoàn tác.`}
        confirmButtonText="Đồng ý"
        confirmButtonColor="success"
      />

      {/* Modal để nhập lý do Từ chối */}
      <CModal
        visible={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>Từ chối yêu cầu</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-3">
            Vui lòng nhập lý do từ chối yêu cầu. Khách hàng sẽ nhận được thông
            báo về lý do này.
          </p>
          <CFormTextarea
            rows={4}
            placeholder="Ví dụ: Sản phẩm đã qua sử dụng, yêu cầu không hợp lệ..."
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
            Hủy
          </CButton>
          <CButton
            color="danger"
            onClick={handleReject}
            disabled={!rejectReason.trim() || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? "Đang xử lý..." : "Xác nhận từ chối"}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default OrderRequestPanel;
