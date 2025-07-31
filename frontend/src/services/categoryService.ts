import axiosInstance from "@/lib/axiosInstance";
import {
  Category,
  CategoryAdmin,
  CategoryCreationData,
  CategoryUpdateData,
  GetCategoriesParams,
  PaginatedAdminCategoriesResponse,
  PaginatedCategoriesResponse,
} from "@/types";
import { AxiosError } from "axios";

// Helper lấy thông điệp lỗi
const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

// --- API Services ---

/**
 * Lấy tất cả danh mục từ backend.
 * Backend controller hiện tại trả về một danh sách phẳng.
 * @returns Promise<Category[]>
 */
export const getAllCategories = async (
  params: GetCategoriesParams = {},
): Promise<PaginatedCategoriesResponse> => {
  try {
    const { data } = await axiosInstance.get<PaginatedCategoriesResponse>(
      "categories",
      { params },
    );
    return data;
  } catch (error: unknown) {
    throw new Error(
      getErrorMessage(error, "Không thể tải danh sách danh mục."),
    );
  }
};

/**
 * Lấy chi tiết một danh mục bằng ID hoặc slug.
 * @param idOrSlug ID hoặc slug của danh mục.
 * @returns Promise<Category | null>
 */
export const getCategoryByIdOrSlug = async (
  idOrSlug: string,
): Promise<Category | null> => {
  try {
    const { data } = await axiosInstance.get<Category>(
      `categories/${idOrSlug}`,
    );
    return data;
  } catch (error: unknown) {
    const err = error as AxiosError;
    if (err.response?.status === 404) return null; // Trả về null nếu không tìm thấy
    throw new Error(
      getErrorMessage(error, `Không thể tải danh mục "${idOrSlug}".`),
    );
  }
};

export const getAdminCategoriesApi = async (
  params: GetCategoriesParams,
): Promise<PaginatedAdminCategoriesResponse> => {
  const { data } = await axiosInstance.get("/categories/admin", { params });
  return data;
};

export const getAdminCategoryDetailsApi = async (
  id: string,
): Promise<CategoryAdmin> => {
  const { data } = await axiosInstance.get<CategoryAdmin>(
    `/categories/admin/${id}`,
  );
  return data;
};

/**
 * Tạo một danh mục mới.
 * @param categoryData Dữ liệu để tạo danh mục.
 * @returns Promise<Category>
 */
export const createCategory = async (
  categoryData: CategoryCreationData,
): Promise<CategoryAdmin> => {
  try {
    const { data } = await axiosInstance.post<CategoryAdmin>(
      "categories",
      categoryData,
    );
    return data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, "Tạo danh mục thất bại."));
  }
};

/**
 * Cập nhật một danh mục.
 * @param categoryId ID của danh mục cần cập nhật.
 * @param categoryData Dữ liệu cập nhật.
 * @returns Promise<Category>
 */
export const updateCategory = async (
  categoryId: string,
  categoryData: CategoryUpdateData,
): Promise<CategoryAdmin> => {
  try {
    const { data } = await axiosInstance.put<CategoryAdmin>(
      `categories/${categoryId}`,
      categoryData,
    );
    return data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, "Cập nhật danh mục thất bại."));
  }
};

/**
 * Xóa (soft delete) một danh mục.
 * @param categoryId ID của danh mục cần xóa.
 * @returns Promise<{ message: string }>
 */
export const deleteCategory = async (
  categoryId: string,
): Promise<{ message: string }> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(
      `categories/${categoryId}`,
    );
    return data;
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, "Xóa danh mục thất bại."));
  }
};
