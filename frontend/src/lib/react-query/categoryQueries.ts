import {
  createCategory as createCategoryApi,
  deleteCategory as deleteCategoryApi,
  getAdminCategoriesApi,
  getAdminCategoryDetailsApi,
  getAllCategories as getAllCategoriesApi,
  getCategoryByIdOrSlug as getCategoryByIdOrSlugApi,
  updateCategory as updateCategoryApi,
} from "@/services/categoryService";
import {
  Category,
  CategoryAdmin,
  CategoryCreationData,
  CategoryUpdateData,
  GetCategoriesParams,
  PaginatedAdminCategoriesResponse,
  PaginatedCategoriesResponse,
} from "@/types";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useLocale, useTranslations } from "next-intl";
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
  options?: CustomQueryOptions<PaginatedCategoriesResponse>,
) => {
  return useQuery<
    PaginatedCategoriesResponse,
    AxiosError<{ message?: string }>
  >({
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
export const useGetAdminCategories = (
  params: GetCategoriesParams,
  options?: { enabled?: boolean },
) => {
  return useQuery<PaginatedAdminCategoriesResponse, Error>({
    queryKey: [...categoryKeys.lists(), "admin", params],
    queryFn: () => getAdminCategoriesApi(params),
    enabled: options?.enabled ?? true,
  });
};

export const useGetAdminCategoryDetails = (
  id: string,
  options?: { enabled?: boolean },
) => {
  return useQuery<CategoryAdmin, Error>({
    queryKey: [...categoryKeys.detail(id), "admin"], // Thêm 'admin' để phân biệt cache
    queryFn: () => getAdminCategoryDetailsApi(id),
    enabled: !!id && (options?.enabled ?? true),
  });
};

// Tạo danh mục mới
export const useCreateCategory = (
  options?: CustomMutationOptions<CategoryAdmin, CategoryCreationData>,
) => {
  const t = useTranslations("reactQuery.category");
  const locale = useLocale();
  const queryClient = useQueryClient();
  return useMutation<
    CategoryAdmin,
    AxiosError<{ message?: string }>,
    CategoryCreationData
  >({
    mutationFn: createCategoryApi,
    onSuccess: (newCategory, variables, context) => {
      const localizedName =
        newCategory.name[locale as "vi" | "en"] || newCategory.name.vi;
      // Invalidate toàn bộ cache danh mục để fetch lại danh sách mới nhất
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      const message = t("createSuccess").replace("{name}", localizedName);
      toast.success(message);
      options?.onSuccess?.(newCategory, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || t("createError"));
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
  options?: CustomMutationOptions<CategoryAdmin, UpdateCategoryVariables>,
) => {
  const t = useTranslations("reactQuery.category");
  const locale = useLocale();
  const queryClient = useQueryClient();
  return useMutation<
    CategoryAdmin,
    AxiosError<{ message?: string }>,
    UpdateCategoryVariables
  >({
    mutationFn: ({ categoryId, categoryData }) =>
      updateCategoryApi(categoryId, categoryData),
    onSuccess: (updatedCategory, variables, context) => {
      const localizedName =
        updatedCategory.name[locale as "vi" | "en"] || updatedCategory.name.vi;
      // toast.success(`Đã cập nhật danh mục "${localizedName}"!`);
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

      const message = t("updateSuccess").replace("{name}", localizedName);
      toast.success(message);
      options?.onSuccess?.(updatedCategory, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || t("updateError"));
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// Xóa (ẩn) danh mục
export const useDeleteCategory = (
  options?: CustomMutationOptions<{ message: string }, string>,
) => {
  const t = useTranslations("reactQuery.category");
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
      toast.success(data.message || t("deleteSuccess"));
      options?.onSuccess?.(data, categoryId, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || t("deleteError"));
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
