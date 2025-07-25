"use client";

import AttributeFormModal from "@/components/admin/attributes/AttributeFormModal";
import AttributeList from "@/components/admin/attributes/AttributeList";
import AttributeValueFormModal from "@/components/admin/attributes/AttributeValueFormModal";
import AttributeValueTable from "@/components/admin/attributes/AttributeValueTable";
import DeleteConfirmationModal from "@/components/shared/DeleteConfirmationModal";
import {
  useAddAttributeValue,
  useDeleteAttributeValue,
  useGetAdminAttributes,
  useUpdateAttributeValue,
} from "@/lib/react-query/attributeQueries";
import { getLocalizedName } from "@/lib/utils";
import { AttributeAdmin, AttributeValueAdmin, I18nField } from "@/types";
import { CCol, CRow, CSpinner } from "@coreui/react";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const AdminAttributesClient = () => {
  const t = useTranslations("AdminAttributes");
  const tShared = useTranslations("Shared.deleteConfirm");
  const locale = useLocale() as "vi" | "en";
  // --- React Query Hooks ---
  const {
    data: attributes = [],
    isLoading,
    isError,
    error,
  } = useGetAdminAttributes();
  const addValueMutation = useAddAttributeValue();
  const updateValueMutation = useUpdateAttributeValue();
  const deleteValueMutation = useDeleteAttributeValue();

  // --- State quản lý UI ---
  const [selectedAttribute, setSelectedAttribute] =
    useState<AttributeAdmin | null>(null);
  const [isAddAttrModalOpen, setAddAttrModalOpen] = useState(false);
  const [valueFormState, setValueFormState] = useState<{
    visible: boolean;
    isEdit: boolean;
    data: Partial<AttributeValueAdmin> | null;
  }>({ visible: false, isEdit: false, data: null });
  const [valueToDelete, setValueToDelete] =
    useState<AttributeValueAdmin | null>(null);

  // --- Handlers ---
  const handleSaveValue = (data: {
    value: I18nField;
    meta?: { hex?: string };
  }) => {
    if (!selectedAttribute) return;

    if (valueFormState.isEdit && valueFormState.data?._id) {
      updateValueMutation.mutate(
        {
          attributeId: selectedAttribute._id,
          valueId: valueFormState.data._id,
          valueData: data,
        },
        {
          onSuccess: () =>
            setValueFormState({ visible: false, isEdit: false, data: null }),
        },
      );
    } else {
      addValueMutation.mutate(
        { attributeId: selectedAttribute._id, valueData: data },
        {
          onSuccess: () =>
            setValueFormState({ visible: false, isEdit: false, data: null }),
        },
      );
    }
  };

  const handleDeleteValue = () => {
    if (selectedAttribute && valueToDelete) {
      deleteValueMutation.mutate(
        { attributeId: selectedAttribute._id, valueId: valueToDelete._id },
        {
          onSuccess: () => setValueToDelete(null),
        },
      );
    }
  };

  useEffect(() => {
    // Nếu có một thuộc tính đang được chọn VÀ danh sách thuộc tính đã có dữ liệu
    if (selectedAttribute && attributes.length > 0) {
      // Tìm phiên bản MỚI NHẤT của thuộc tính đang được chọn trong danh sách attributes vừa được fetch lại
      const updatedVersionOfSelected = attributes.find(
        (attr) => attr._id === selectedAttribute._id,
      );

      // Nếu tìm thấy, cập nhật lại state cục bộ với phiên bản mới này
      // Điều kiện `if` này cũng giúp tránh việc cập nhật không cần thiết nếu object không đổi
      if (updatedVersionOfSelected) {
        // So sánh chuỗi JSON là một cách đơn giản để kiểm tra xem object có thực sự thay đổi không,
        // tránh vòng lặp re-render vô tận.
        if (
          JSON.stringify(selectedAttribute) !==
          JSON.stringify(updatedVersionOfSelected)
        ) {
          setSelectedAttribute(updatedVersionOfSelected);
        }
      } else {
        // Nếu không tìm thấy (ví dụ thuộc tính đã bị xóa), reset lựa chọn
        setSelectedAttribute(null);
      }
    } else if (!selectedAttribute && attributes.length > 0) {
      // Tự động chọn thuộc tính đầu tiên nếu chưa có gì được chọn
      setSelectedAttribute(attributes[0]);
    }
  }, [attributes, selectedAttribute]);

  if (isLoading)
    return (
      <div className="p-5 text-center">
        <CSpinner /> {t("loading")}
      </div>
    );
  if (isError)
    return (
      <div className="text-danger p-5 text-center">
        {t("loadingError", { error: error.message })}
      </div>
    );

  return (
    <>
      <CRow>
        <CCol md={4}>
          <AttributeList
            attributes={attributes}
            selectedAttributeId={selectedAttribute?._id || null}
            onSelectAttribute={setSelectedAttribute}
            onAddNewAttribute={() => setAddAttrModalOpen(true)}
          />
        </CCol>
        <CCol md={8}>
          {selectedAttribute ? (
            <AttributeValueTable
              selectedAttribute={selectedAttribute}
              onAddValue={() =>
                setValueFormState({
                  visible: true,
                  isEdit: false,
                  data: { value: { vi: "", en: "" } },
                })
              }
              onEditValue={(value) =>
                setValueFormState({ visible: true, isEdit: true, data: value })
              }
              onDeleteValue={setValueToDelete}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500">
              <p>{t("selectAttributePrompt")}</p>
            </div>
          )}
        </CCol>
      </CRow>

      <AttributeFormModal
        visible={isAddAttrModalOpen}
        onClose={() => setAddAttrModalOpen(false)}
      />

      <AttributeValueFormModal
        visible={!!valueFormState.visible}
        isEdit={valueFormState.isEdit}
        initialData={valueFormState.data as AttributeValueAdmin | null}
        onClose={() =>
          setValueFormState({ visible: false, isEdit: false, data: null })
        }
        onSave={handleSaveValue}
        isSaving={addValueMutation.isPending || updateValueMutation.isPending}
      />

      <DeleteConfirmationModal
        visible={!!valueToDelete}
        onClose={() => setValueToDelete(null)}
        onConfirm={handleDeleteValue}
        isDeleting={deleteValueMutation.isPending}
        title={tShared("title")}
        message={
          // Truyền vào một ReactNode
          <>
            {tShared.rich("message", {
              name: valueToDelete
                ? getLocalizedName(valueToDelete.value, locale)
                : "",
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
            <br />
            <small className="text-muted">{tShared("warning")}</small>
          </>
        }
        confirmButtonText={tShared("confirmButton")}
        cancelButtonText={tShared("cancelButton")}
      />
    </>
  );
};

export default AdminAttributesClient;
