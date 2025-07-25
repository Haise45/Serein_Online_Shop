"use client";

import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
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
import { useTranslations } from "next-intl";

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title?: string;
  message: React.ReactNode; // Dùng ReactNode để có thể truyền cả text và HTML (VD: <strong>)
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isDeleting,
  title,
  message,
  confirmButtonText,
  cancelButtonText,
}) => {
  const t = useTranslations("Shared.deleteConfirm");
  const finalConfirmText = confirmButtonText || t("confirmButton");
  const finalCancelText = cancelButtonText || t("cancelButton");

  return (
    <CModal
      alignment="center"
      visible={visible}
      onClose={onClose}
      backdrop="static" // Ngăn không cho đóng modal khi click ra ngoài
    >
      <CModalHeader className="border-b-0 pb-0">
        <CModalTitle className="flex items-center text-xl font-bold">
          <CIcon icon={cilWarning} className="text-danger mr-3" size="xl" />
          {title || t("title")}
        </CModalTitle>
      </CModalHeader>
      <CModalBody className="py-4 text-gray-700">{message}</CModalBody>
      <CModalFooter className="border-t-0 pt-0">
        <CButton
          color="secondary"
          variant="outline"
          onClick={onClose}
          disabled={isDeleting}
        >
          {finalCancelText}
        </CButton>
        <CButton color="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting && (
            <CSpinner
              as="span"
              size="sm"
              aria-hidden="true"
              className="mr-2"
            />
          )}
          {isDeleting ? t("deleting") : finalConfirmText}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default DeleteConfirmationModal;
