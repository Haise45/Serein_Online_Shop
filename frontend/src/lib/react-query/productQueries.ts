import {
  getProductByIdOrSlug as getProductByIdOrSlugApi,
  getProducts as getProductsApi,
  getAdminProductsApi,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
  GetProductsParams,
  PaginatedProductsResponse,
  ProductCreationData, // Dùng cho admin
  ProductUpdateData,
  StockUpdateResponse,
  updateVariantStockApi,
  updateProductStockApi,
  getAdminProductDetailsApi,
  PaginatedAdminProductsResponse,
} from "@/services/productService";
import { Product, ProductAdmin } from "@/types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";

// --- Query Keys ---
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (
    params: GetProductsParams | undefined, // Key cho client list
  ) =>
    [
      ...productKeys.lists(),
      params ? { ...params, context: "client" } : { context: "client" },
    ] as const,
  adminLists: () => [...productKeys.all, "adminList"] as const, // Key riêng cho admin list
  adminList: (
    params: GetProductsParams | undefined, // Key cho admin list với params
  ) => [...productKeys.adminLists(), params || {}] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (
    idOrSlug: string | undefined, // Key cho client detail
  ) => [...productKeys.details(), idOrSlug] as const,
  adminDetails: () => [...productKeys.all, "adminDetail"] as const, // Key riêng cho admin detail
  adminDetail: (idOrSlug: string | undefined) =>
    [...productKeys.adminDetails(), idOrSlug] as const,
};

// --- Type cho options của hooks ---
type CustomQueryOptions<
  TData,
  TError = AxiosError<{ message?: string }>,
> = Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;

type CustomMutationOptions<
  TData,
  TVariables,
  TError = AxiosError<{ message?: string }>,
> = Omit<
  UseMutationOptions<TData, TError, TVariables, unknown>, // Thêm TVariables
  "mutationFn"
>;

// === CLIENT FACING HOOKS ===

// --- Custom Hook: Lấy danh sách sản phẩm (Client) ---
export const useGetProducts = (
  params?: GetProductsParams,
  options?: CustomQueryOptions<PaginatedProductsResponse>,
) => {
  return useQuery<PaginatedProductsResponse, AxiosError<{ message?: string }>>({
    queryKey: productKeys.list(params), // Sử dụng client list key
    queryFn: () => getProductsApi(params), // Giả sử API này tự xử lý isActive:true, isPublished:true
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

// --- Custom Hook: Lấy chi tiết sản phẩm (Client) ---
export const useGetProductDetails = (
  idOrSlug: string | undefined,
  options?: CustomQueryOptions<Product | null>,
) => {
  return useQuery<Product | null, AxiosError<{ message?: string }>>({
    queryKey: productKeys.detail(idOrSlug), // Sử dụng client detail key
    queryFn: () => {
      if (!idOrSlug) return Promise.resolve(null);
      // API getProductByIdOrSlugApi sẽ chỉ trả về active & published product
      return getProductByIdOrSlugApi(idOrSlug);
    },
    enabled: options?.enabled ?? !!idOrSlug,
    ...options,
  });
};

// === ADMIN FACING HOOKS ===

// --- Custom Hook: Lấy danh sách sản phẩm (Admin) ---
export const useGetAdminProducts = (
  params: GetProductsParams,
  options?: { enabled?: boolean },
) => {
  return useQuery<PaginatedAdminProductsResponse, Error>({
    queryKey: [...productKeys.lists(), "admin", params],
    queryFn: () => getAdminProductsApi(params),
    enabled: options?.enabled ?? true,
  });
};

// --- Custom Hook: Lấy chi tiết một sản phẩm (Admin) ---
// Admin có thể xem cả sản phẩm chưa publish/active
export const useGetAdminProductDetails = (productId: string) => {
  return useQuery<ProductAdmin, Error>({
    queryKey: productKeys.adminDetail(productId),
    queryFn: () => getAdminProductDetailsApi(productId),
    enabled: !!productId,
  });
};

// --- Custom Hook: Tạo sản phẩm mới (Admin) ---
export const useCreateAdminProduct = (
  options?: CustomMutationOptions<ProductAdmin, ProductCreationData>,
) => {
  const t = useTranslations("reactQuery.product");
  const queryClient = useQueryClient();
  const locale = useLocale();
  return useMutation<
    ProductAdmin,
    AxiosError<{ message?: string }>,
    ProductCreationData
  >({
    mutationFn: createProductApi,
    onSuccess: (newProduct, variables, context) => {
      // Lấy tên sản phẩm theo ngôn ngữ hiện tại, fallback về tiếng Việt
      const localizedName =
        newProduct.name[locale as "vi" | "en"] || newProduct.name.vi;
      queryClient.invalidateQueries({ queryKey: productKeys.adminLists() }); // Invalidate danh sách admin
      // Có thể cập nhật cache trực tiếp cho chi tiết sản phẩm mới này
      queryClient.setQueryData(
        productKeys.adminDetail(newProduct._id),
        newProduct,
      );
      const message = t("createSuccess").replace("{name}", localizedName);
      toast.success(message);
      options?.onSuccess?.(newProduct, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || t("createError"));
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// --- Custom Hook: Cập nhật sản phẩm (Admin) ---
interface UpdateAdminProductVariables {
  productId: string;
  productData: ProductUpdateData;
}
export const useUpdateAdminProduct = (
  options?: CustomMutationOptions<ProductAdmin, UpdateAdminProductVariables>,
) => {
  const t = useTranslations("reactQuery.product");
  const queryClient = useQueryClient();
  const locale = useLocale();
  return useMutation<
    ProductAdmin,
    AxiosError<{ message?: string }>,
    UpdateAdminProductVariables
  >({
    mutationFn: ({ productId, productData }) =>
      updateProductApi(productId, productData),
    onSuccess: (updatedProduct, variables, context) => {
      const localizedName =
        updatedProduct.name[locale as "vi" | "en"] || updatedProduct.name.vi;
      // Cập nhật cache cho chi tiết sản phẩm đã sửa
      queryClient.setQueryData(
        productKeys.adminDetail(variables.productId),
        updatedProduct,
      );

      // Invalidate danh sách để lấy lại
      queryClient.invalidateQueries({ queryKey: productKeys.adminLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() }); // Cả list của client

      const message = t("updateSuccess").replace("{name}", localizedName);
      toast.success(message);
      options?.onSuccess?.(updatedProduct, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || t("updateError"));
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// --- Custom Hook: Xóa (Soft Delete) sản phẩm (Admin) ---
export const useDeleteAdminProduct = (
  options?: CustomMutationOptions<{ message: string }, string>, // string là productId
) => {
  const t = useTranslations("reactQuery.product");
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    AxiosError<{ message?: string }>,
    string
  >({
    mutationFn: deleteProductApi,
    onSuccess: (data, productId, context) => {
      toast.success(data.message || t("deleteSuccess"));
      // Xóa khỏi cache chi tiết
      queryClient.removeQueries({
        queryKey: productKeys.adminDetail(productId),
      });
      queryClient.removeQueries({ queryKey: productKeys.detail(productId) });
      // Invalidate danh sách
      queryClient.invalidateQueries({ queryKey: productKeys.adminLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      options?.onSuccess?.(data, productId, context);
    },
    onError: (error, productId, context) => {
      toast.error(error.response?.data?.message || t("deleteError"));
      options?.onError?.(error, productId, context);
    },
    ...options,
  });
};

// --- Hook cập nhật tồn kho sản phẩm chính ---
interface UpdateStockVariables {
  productId: string;
  update: { change?: number; set?: number };
}
export const useUpdateProductStock = (
  options?: CustomMutationOptions<StockUpdateResponse, UpdateStockVariables>,
) => {
  const t = useTranslations("reactQuery.product");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, update }) =>
      updateProductStockApi(productId, update),
    onSuccess: (data) => {
      toast.success(t("updateStockSuccess"));
      // Invalidate cả danh sách và chi tiết để làm mới dữ liệu
      queryClient.invalidateQueries({ queryKey: productKeys.adminLists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(data.productId),
      });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || t("updateStockError")),
    ...options,
  });
};

// --- Hook cập nhật tồn kho biến thể ---
interface UpdateVariantStockVariables {
  productId: string;
  variantId: string;
  update: { change?: number; set?: number };
}
export const useUpdateVariantStock = (
  options?: CustomMutationOptions<
    StockUpdateResponse,
    UpdateVariantStockVariables
  >,
) => {
  const t = useTranslations("reactQuery.product");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId, update }) =>
      updateVariantStockApi(productId, variantId, update),
    onSuccess: (data) => {
      toast.success(t("updateVariantStockSuccess"));
      queryClient.invalidateQueries({ queryKey: productKeys.adminLists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(data.productId),
      });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || t("updateStockError")),
    ...options,
  });
};
