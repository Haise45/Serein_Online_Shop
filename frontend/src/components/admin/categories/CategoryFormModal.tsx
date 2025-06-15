import { Category } from '@/types';
import { CButton, CFormCheck, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from '@coreui/react';
import Image from 'next/image';
import React from 'react';
import { CategoryFormState } from '@/app/admin/categories/AdminCategoriesClient';

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditMode: boolean;
  currentCategory: CategoryFormState;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  categoriesForSelect: Category[];
  formErrors: Record<string, string>;
  isSubmitting: boolean;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  visible, onClose, onSubmit, isEditMode, currentCategory, onFormChange,
  onImageFileChange, categoriesForSelect, formErrors, isSubmitting
}) => {
  return (
    <CModal alignment="center" visible={visible} onClose={onClose} size="lg">
      <CModalHeader><CModalTitle>{isEditMode ? "Chỉnh sửa Danh mục" : "Tạo Danh mục mới"}</CModalTitle></CModalHeader>
      <CModalBody>
        <CFormInput type="hidden" name="_id" value={currentCategory._id || ''} />
        <div className="mb-3">
          <CFormLabel htmlFor="name">Tên danh mục*</CFormLabel>
          <CFormInput id="name" name="name" value={currentCategory.name || ''} onChange={onFormChange} invalid={!!formErrors.name} />
          {formErrors.name && <div className="text-red-500 text-sm mt-1">{formErrors.name}</div>}
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="description">Mô tả</CFormLabel>
          <CFormTextarea id="description" name="description" value={currentCategory.description || ''} onChange={onFormChange} rows={3} />
        </div>
        <div className="mb-3">
          <CFormLabel htmlFor="parent">Danh mục cha</CFormLabel>
          <CFormSelect id="parent" name="parent" value={currentCategory.parent || ''} onChange={onFormChange}>
            <option value="">-- Không có --</option>
            {categoriesForSelect.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </CFormSelect>
        </div>
        <div className="mb-3">
          <CFormLabel>Ảnh đại diện</CFormLabel>
          <CFormInput type="file" accept="image/*" onChange={onImageFileChange} className="mb-2"/>
          {currentCategory.image && (
            <div className="mt-2"><Image src={currentCategory.image} alt="Xem trước" width={100} height={100} className="w-24 h-24 rounded-md object-cover border"/></div>
          )}
        </div>
        <div className="mb-3">
          <CFormCheck id="isActive" name="isActive" label="Kích hoạt danh mục" checked={currentCategory.isActive ?? true} onChange={onFormChange} />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Hủy</CButton>
        <CButton color="primary" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting && <CSpinner size="sm" className="mr-2" />}
          Lưu
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default CategoryFormModal;