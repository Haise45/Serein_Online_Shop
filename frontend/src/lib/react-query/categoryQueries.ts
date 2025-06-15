import {
  getAllCategories as getAllCategoriesApi,
  getCategoryByIdOrSlug as getCategoryByIdOrSlugApi,
  createCategory as createCategoryApi,
  updateCategory as updateCategoryApi,
  deleteCategory as deleteCategoryApi,
} from "@/services/categoryService";
import {
  Category,
  CategoryCreationData,
  CategoryUpdateData,
  GetCategoriesParams,
  PaginatedCategoriesResponse,
} from "@/types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

// --- Query Keys ---
export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params: GetCategoriesParams = {}) =>
    [...categoryKeys.lists(), params] as const,
  details: () => [...categoryKeys.all, "detail"] as const,
  detail: (idOrSlug: string) => [...categoryKeys.details(), idOrSlug] as const,
};

// --- Type cho Options ---
type CustomQueryOptions<
  TData,
  TError = AxiosError<{ message?: string }>,
> = Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
type CustomMutationOptions<
  TData,
  TVariables,
  TError = AxiosError<{ message?: string }>,
> = Omit<UseMutationOptions<TData, TError, TVariables, unknown>, "mutationFn">;

// --- Query Hooks ---

// Lấy tất cả danh mục (danh sách phẳng)
export const useGetAllCategories = (
  params: GetCategoriesParams = {},
  options?: CustomQueryOptions<PaginatedCategoriesResponse>
) => {
  return useQuery<PaginatedCategoriesResponse, AxiosError<{ message?: string }>>({
    queryKey: categoryKeys.list(params),
    queryFn: () => getAllCategoriesApi(params),
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

// Lấy chi tiết một danh mục
export const useGetCategoryDetails = (
  idOrSlug: string,
  options?: CustomQueryOptions<Category | null>,
) => {
  return useQuery<Category | null, AxiosError<{ message?: string }>>({
    queryKey: categoryKeys.detail(idOrSlug),
    queryFn: () => getCategoryByIdOrSlugApi(idOrSlug),
    enabled: !!idOrSlug,
    ...options,
  });
};

// --- Mutation Hooks ---

// Tạo danh mục mới
export const useCreateCategory = (
  options?: CustomMutationOptions<Category, CategoryCreationData>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Category,
    AxiosError<{ message?: string }>,
    CategoryCreationData
  >({
    mutationFn: createCategoryApi,
    onSuccess: (newCategory, variables, context) => {
      // Invalidate toàn bộ cache danh mục để fetch lại danh sách mới nhất
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success(`Đã tạo thành công danh mục "${newCategory.name}"!`);
      options?.onSuccess?.(newCategory, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || "Tạo danh mục thất bại.");
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// Cập nhật danh mục
interface UpdateCategoryVariables {
  categoryId: string;
  categoryData: CategoryUpdateData;
}
export const useUpdateCategory = (
  options?: CustomMutationOptions<Category, UpdateCategoryVariables>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Category,
    AxiosError<{ message?: string }>,
    UpdateCategoryVariables
  >({
    mutationFn: ({ categoryId, categoryData }) =>
      updateCategoryApi(categoryId, categoryData),
    onSuccess: (updatedCategory, variables, context) => {
      // Cập nhật cache cho danh sách
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      // Cập nhật cache cho chi tiết của danh mục vừa sửa
      queryClient.setQueryData(
        categoryKeys.detail(variables.categoryId),
        updatedCategory,
      );
      queryClient.setQueryData(
        categoryKeys.detail(updatedCategory.slug),
        updatedCategory,
      );

      toast.success(`Đã cập nhật danh mục "${updatedCategory.name}"!`);
      options?.onSuccess?.(updatedCategory, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message || "Cập nhật danh mục thất bại.",
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// Xóa (ẩn) danh mục
export const useDeleteCategory = (
  options?: CustomMutationOptions<{ message: string }, string>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    AxiosError<{ message?: string }>,
    string
  >({
    // string là categoryId
    mutationFn: deleteCategoryApi,
    onSuccess: (data, categoryId, context) => {
      // Invalidate danh sách để làm mới
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      toast.success(data.message || "Đã xóa danh mục thành công.");
      options?.onSuccess?.(data, categoryId, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || "Xóa danh mục thất bại.");
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
