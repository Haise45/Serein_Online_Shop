"use client";

import { useSettings } from "@/app/SettingsContext";
// --- Import các component con ---
import CategoryDeleteModal from "@/components/admin/categories/CategoryDeleteModal";
import CategoryFilters from "@/components/admin/categories/CategoryFilters";
import CategoryFormModal from "@/components/admin/categories/CategoryFormModal";
import CategoryListTable from "@/components/admin/categories/CategoryListTable";
import DataTablePagination from "@/components/admin/layout/DataTablePagination";

// --- Import các hooks, types và utilities ---
import useDebounce from "@/hooks/useDebounce";
import {
  useCreateCategory,
  useDeleteCategory,
  useGetAllCategories,
  useUpdateCategory,
} from "@/lib/react-query/categoryQueries";
import { useUploadImages } from "@/lib/react-query/uploadQueries";
import {
  Category,
  CategoryCreationData,
  CategoryUpdateData,
  GetCategoriesParams,
} from "@/types";
import { cilWarning } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from "@coreui/react";
import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";

// --- Type cho State của Form trong Modal ---
// Dùng Partial<Category> để có thể dùng chung cho cả Create và Edit
// `parent` được định nghĩa là string | null để khớp với value của <select>
export type CategoryFormState = Partial<
  Omit<Category, "parent"> & { parent: string | null }
>;

const AdminCategoriesClient = () => {
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  // Lấy số item mỗi trang từ settings, nếu không có thì fallback về giá trị cũ
  const defaultLimitFromSettings =
    settings?.adminTable?.defaultItemsPerPage || 10;
  // --- States cho Filter, Search, và Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(
    Number(searchParams.get("limit")) || defaultLimitFromSettings || 10,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIsActive, setFilterIsActive] = useState<"" | "true" | "false">(
    "",
  );
  const [filterParent, setFilterParent] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce để tránh gọi API liên tục khi gõ

  // --- States cho Modal và Form ---
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<CategoryFormState>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    category: Category | null;
  }>({ visible: false, category: null });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  // --- React Query Hooks để tương tác với API ---

  // Tạo params object để truyền vào hook useGetAllCategories.
  // Các params này sẽ được gửi thẳng đến API backend
  const queryParams: GetCategoriesParams = useMemo(
    () => ({
      page: currentPage,
      limit: limit,
      search: debouncedSearchTerm || undefined,
      isActive: filterIsActive === "" ? undefined : filterIsActive === "true",
      parent: filterParent || undefined,
    }),
    [currentPage, limit, debouncedSearchTerm, filterIsActive, filterParent],
  );

  const {
    data: paginatedData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllCategories(queryParams);
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const uploadImageMutation = useUploadImages();

  // --- Dữ liệu được tính toán và ghi nhớ (Memoized) ---

  const categoriesToDisplay = useMemo(
    () => paginatedData?.categories || [],
    [paginatedData],
  );

  // Lấy thông tin phân trang
  const totalItems = useMemo(
    () => paginatedData?.totalCategories || 0,
    [paginatedData],
  );
  const totalPages = useMemo(
    () => paginatedData?.totalPages || 1,
    [paginatedData],
  );

  // Lấy toàn bộ danh sách (không phân trang) để làm danh sách chọn parent
  // Điều này yêu cầu một lần gọi API riêng biệt hoặc backend cung cấp một endpoint khác
  const { data: allCategoriesData, isLoading: isLoadingAllCategories } =
    useGetAllCategories({ limit: 9999, isActive: true });

  // Danh sách này dùng cho cả 2 dropdown
  const flatListOfAllActiveCategories = useMemo(
    () => allCategoriesData?.categories || [],
    [allCategoriesData],
  );

  // Tạo danh sách các danh mục để chọn làm parent (loại bỏ chính nó và các con của nó)
  const categoriesForSelect = useMemo(() => {
    if (!isEditMode || !currentCategory._id)
      return flatListOfAllActiveCategories;

    // Logic loại bỏ chính nó và con cháu khỏi danh sách chọn parent
    // Hàm đệ quy để lấy ID của tất cả các con cháu
    const getDescendantIds = (parentId: string): string[] => {
      let ids: string[] = [];
      const children = flatListOfAllActiveCategories.filter(
        (c) =>
          (typeof c.parent === "string" ? c.parent : c.parent?._id) ===
          parentId,
      );
      for (const child of children) {
        ids.push(child._id);
        ids = ids.concat(getDescendantIds(child._id));
      }
      return ids;
    };
    const descendantIds = getDescendantIds(currentCategory._id);
    const forbiddenIds = [currentCategory._id, ...descendantIds];
    return flatListOfAllActiveCategories.filter(
      (c) => !forbiddenIds.includes(c._id),
    );
  }, [flatListOfAllActiveCategories, isEditMode, currentCategory._id]);

  // --- Các hàm xử lý sự kiện (Handlers) ---

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };
  const handleFilterChange = (value: "" | "true" | "false") => {
    setFilterIsActive(value);
    setCurrentPage(1);
  };
  const handleParentFilterChange = (value: string) => {
    setFilterParent(value);
    setCurrentPage(1);
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Mở modal để tạo danh mục mới
  const openCreateModal = () => {
    setIsEditMode(false);
    setCurrentCategory({
      name: "",
      description: "",
      parent: null,
      image: "",
      isActive: true,
    });
    setImageFile(null);
    setFormErrors({});
    setModalVisible(true);
  };

  // Mở modal để chỉnh sửa một danh mục đã có
  const openEditModal = (category: Category) => {
    setIsEditMode(true);
    // Chuyển đổi `parent` từ object/string thành string ID hoặc null
    const parentId =
      typeof category.parent === "string"
        ? category.parent
        : category.parent?._id || null;
    setCurrentCategory({ ...category, parent: parentId });
    setImageFile(null);
    setFormErrors({});
    setModalVisible(true);
  };

  // Xử lý thay đổi trên các trường của form
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    // Xử lý riêng cho checkbox
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setCurrentCategory((prev) => ({ ...prev, [name]: checked }));
    } else {
      setCurrentCategory((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Xử lý khi người dùng chọn file ảnh mới
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Tạo URL tạm thời để xem trước ảnh
      const previewUrl = URL.createObjectURL(file);
      setCurrentCategory((prev) => ({ ...prev, image: previewUrl }));
    }
  };

  // Kiểm tra tính hợp lệ của form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!currentCategory.name?.trim()) {
      errors.name = "Tên danh mục là bắt buộc.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Xử lý khi submit form (cả tạo mới và cập nhật)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    let imageUrl = isEditMode ? currentCategory.image || "" : "";

    // Bước 1: Upload ảnh nếu có file mới được chọn
    if (imageFile) {
      try {
        const uploadData = await uploadImageMutation.mutateAsync({
          files: [imageFile],
          area: "categories",
        });
        imageUrl = uploadData.imageUrls[0]; // Lấy URL từ kết quả upload
      } catch {
        toast.error("Upload ảnh thất bại!");
        return;
      }
    }

    // Bước 2: Chuẩn bị payload để gửi lên API
    const categoryData: CategoryCreationData | CategoryUpdateData = {
      name: currentCategory.name,
      description: currentCategory.description,
      image: imageUrl,
      isActive: currentCategory.isActive,
      parent: currentCategory.parent || null,
    };

    // Bước 3: Gọi mutation tương ứng
    if (isEditMode && currentCategory._id) {
      updateCategoryMutation.mutate({
        categoryId: currentCategory._id,
        categoryData,
      });
    } else {
      createCategoryMutation.mutate(categoryData as CategoryCreationData);
    }
    setModalVisible(false);
  };

  // Thực hiện hành động xóa
  const handleDelete = () => {
    if (deleteConfirm.category) {
      deleteCategoryMutation.mutate(deleteConfirm.category._id, {
        onSuccess: () => setDeleteConfirm({ visible: false, category: null }),
      });
    }
  };

  // --- Xử lý trạng thái Loading và Error của trang chính ---
  if (isLoading) {
    return (
      <div className="p-5 text-center">
        <CSpinner /> Đang tải danh sách danh mục...
      </div>
    );
  }
  if (isError) {
    return (
      <div className="text-danger bg-danger-light rounded border p-5 text-center">
        <CIcon icon={cilWarning} size="xl" className="mb-3" />
        <h4 className="mb-2">Lỗi không thể tải danh mục</h4>
        <p>{error?.message || "Đã có lỗi xảy ra."}</p>
        <CButton color="primary" onClick={() => refetch()} className="mt-3">
          Thử lại
        </CButton>
      </div>
    );
  }

  // --- Render chính của Component ---
  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="border-b-0 !p-4">
              <CategoryFilters
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                filterIsActive={filterIsActive}
                onFilterChange={handleFilterChange}
                filterParent={filterParent}
                onParentChange={handleParentFilterChange}
                parentCategoryOptions={flatListOfAllActiveCategories}
                isLoadingParentCategories={isLoadingAllCategories}
                onAddNew={openCreateModal}
              />
            </CCardHeader>
            <CCardBody className="p-0">
              {isLoading && !paginatedData ? (
                <div className="p-5 text-center">
                  <CSpinner /> Đang tải dữ liệu...
                </div>
              ) : (
                <CategoryListTable
                  categories={categoriesToDisplay}
                  onEdit={openEditModal}
                  onDelete={(cat) =>
                    setDeleteConfirm({ visible: true, category: cat })
                  }
                />
              )}
            </CCardBody>
            {totalItems > 0 && (
              <CCardFooter className="!p-0">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  limit={limit}
                  onPageChange={setCurrentPage}
                  onLimitChange={handleLimitChange}
                  itemType="danh mục"
                  defaultLimitFromSettings={defaultLimitFromSettings}
                />
              </CCardFooter>
            )}
          </CCard>
        </CCol>
      </CRow>

      {/* Modal để thêm/sửa, chỉ render khi cần */}
      {modalVisible && (
        <CategoryFormModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleSubmit}
          isEditMode={isEditMode}
          currentCategory={currentCategory}
          onFormChange={handleFormChange}
          onImageFileChange={handleImageFileChange}
          categoriesForSelect={categoriesForSelect}
          formErrors={formErrors}
          isSubmitting={
            createCategoryMutation.isPending ||
            updateCategoryMutation.isPending ||
            uploadImageMutation.isPending
          }
        />
      )}

      {/* Modal xác nhận xóa, chỉ render khi cần */}
      {deleteConfirm.visible && (
        <CategoryDeleteModal
          visible={deleteConfirm.visible}
          onClose={() => setDeleteConfirm({ visible: false, category: null })}
          onConfirm={handleDelete}
          category={deleteConfirm.category}
          isDeleting={deleteCategoryMutation.isPending}
        />
      )}
    </>
  );
};

export default AdminCategoriesClient;
