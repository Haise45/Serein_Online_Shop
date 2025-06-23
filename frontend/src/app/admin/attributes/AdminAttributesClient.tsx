"use client";

import AttributeFormModal from "@/components/admin/attributes/AttributeFormModal";
import AttributeList from "@/components/admin/attributes/AttributeList";
import AttributeValueFormModal from "@/components/admin/attributes/AttributeValueFormModal";
import AttributeValueTable from "@/components/admin/attributes/AttributeValueTable";
import DeleteConfirmationModal from "@/components/shared/DeleteConfirmationModal";
import {
  useAddAttributeValue,
  useDeleteAttributeValue,
  useGetAttributes,
  useUpdateAttributeValue,
} from "@/lib/react-query/attributeQueries";
import { Attribute, AttributeValue, AttributeValueCreationData } from "@/types";
import { CCol, CRow, CSpinner } from "@coreui/react";
import React, { useEffect, useState } from "react";

const AdminAttributesClient = () => {
  // --- React Query Hooks ---
  const {
    data: attributes = [],
    isLoading,
    isError,
    error,
  } = useGetAttributes();
  const addValueMutation = useAddAttributeValue();
  const updateValueMutation = useUpdateAttributeValue();
  const deleteValueMutation = useDeleteAttributeValue();

  // --- State quản lý UI ---
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(
    null,
  );
  const [isAddAttrModalOpen, setAddAttrModalOpen] = useState(false);
  const [valueToEdit, setValueToEdit] = useState<AttributeValue | null>(null);
  const [valueToDelete, setValueToDelete] = useState<AttributeValue | null>(
    null,
  );

  // --- Handlers ---
  const handleSaveValue = (valueData: AttributeValueCreationData) => {
    if (!selectedAttribute) return;

    if (valueToEdit?._id) {
      // Update existing value
      updateValueMutation.mutate(
        {
          attributeId: selectedAttribute._id,
          valueId: valueToEdit._id,
          valueData,
        },
        {
          onSuccess: () => setValueToEdit(null),
        },
      );
    } else {
      // Add new value
      addValueMutation.mutate(
        {
          attributeId: selectedAttribute._id,
          valueData,
        },
        {
          onSuccess: () => setValueToEdit(null),
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
    }
  }, [attributes, selectedAttribute]);

  if (isLoading)
    return (
      <div className="p-5 text-center">
        <CSpinner />
      </div>
    );
  if (isError)
    return (
      <div className="text-danger p-5 text-center">Lỗi: {error.message}</div>
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
              onAddValue={() => setValueToEdit({} as AttributeValue)} // Mở modal thêm mới
              onEditValue={setValueToEdit}
              onDeleteValue={setValueToDelete}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500">
              <p>Chọn một thuộc tính để xem chi tiết</p>
            </div>
          )}
        </CCol>
      </CRow>

      <AttributeFormModal
        visible={isAddAttrModalOpen}
        onClose={() => setAddAttrModalOpen(false)}
      />

      <AttributeValueFormModal
        visible={!!valueToEdit}
        isEdit={!!valueToEdit?._id}
        initialData={valueToEdit}
        onClose={() => setValueToEdit(null)}
        onSave={handleSaveValue}
        isSaving={addValueMutation.isPending || updateValueMutation.isPending}
      />

      <DeleteConfirmationModal
        visible={!!valueToDelete}
        onClose={() => setValueToDelete(null)}
        onConfirm={handleDeleteValue}
        isDeleting={deleteValueMutation.isPending}
        title="Xác nhận xóa giá trị"
        message={
          // Truyền vào một ReactNode
          <>
            Bạn có chắc muốn xóa giá trị &quot;
            <strong>{valueToDelete?.value}</strong>&quot;?
            <br />
            <small className="text-muted">
              Hành động này không thể hoàn tác.
            </small>
          </>
        }
      />
    </>
  );
};

export default AdminAttributesClient;
