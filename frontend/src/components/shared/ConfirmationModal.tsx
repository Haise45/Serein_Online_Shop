import {
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from "@coreui/react";
import React from "react";

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "light"
    | "dark";
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  body,
  confirmButtonText = "Xác nhận",
  cancelButtonText = "Hủy",
  confirmButtonColor = "primary",
  isConfirming = false,
}) => {
  return (
    <CModal alignment="center" visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>{title}</CModalTitle>
      </CModalHeader>
      <CModalBody>{body}</CModalBody>
      <CModalFooter>
        <CButton
          color="secondary"
          variant="outline"
          onClick={onClose}
          disabled={isConfirming}
        >
          {cancelButtonText}
        </CButton>
        <CButton
          color={confirmButtonColor}
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {isConfirming ? <CSpinner size="sm" className="me-2" /> : null}
          {isConfirming ? "Đang xử lý..." : confirmButtonText}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ConfirmationModal;
