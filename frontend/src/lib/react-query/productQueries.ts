import {
  getProductByIdOrSlug as getProductByIdOrSlugApi,
  getProducts as getProductsApi,
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
} from "@/services/productService";
import { Product } from "@/types";
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
  params?: GetProductsParams,
  options?: CustomQueryOptions<PaginatedProductsResponse>,
) => {
  return useQuery<PaginatedProductsResponse, AxiosError<{ message?: string }>>({
    queryKey: productKeys.adminList(params), // Sử dụng admin list key
    queryFn: () => getProductsApi(params), // Gọi cùng service, backend sẽ phân quyền
    placeholderData: (previousData) => previousData,
    ...options,
  });
};

// --- Custom Hook: Lấy chi tiết một sản phẩm (Admin) ---
// Admin có thể xem cả sản phẩm chưa publish/active
export const useGetAdminProductDetails = (
  idOrSlug: string | undefined,
  options?: CustomQueryOptions<Product | null>,
) => {
  return useQuery<Product | null, AxiosError<{ message?: string }>>({
    queryKey: productKeys.adminDetail(idOrSlug), // Sử dụng admin detail key
    queryFn: () => {
      if (!idOrSlug) return Promise.resolve(null);
      // Gọi cùng service, backend sẽ phân quyền
      // Hoặc tạo getAdminProductByIdOrSlugApi nếu endpoint khác
      return getProductByIdOrSlugApi(idOrSlug);
    },
    enabled: options?.enabled ?? !!idOrSlug,
    ...options,
  });
};

// --- Custom Hook: Tạo sản phẩm mới (Admin) ---
export const useCreateAdminProduct = (
  options?: CustomMutationOptions<Product, ProductCreationData>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Product,
    AxiosError<{ message?: string }>,
    ProductCreationData
  >({
    mutationFn: createProductApi,
    onSuccess: (newProduct, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productKeys.adminLists() }); // Invalidate danh sách admin
      // Có thể cập nhật cache trực tiếp cho chi tiết sản phẩm mới này
      queryClient.setQueryData(
        productKeys.adminDetail(newProduct._id),
        newProduct,
      );
      toast.success(`Sản phẩm "${newProduct.name}" đã được tạo thành công!`);
      options?.onSuccess?.(newProduct, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error.response?.data?.message || "Tạo sản phẩm thất bại.");
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
  options?: CustomMutationOptions<Product, UpdateAdminProductVariables>,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Product,
    AxiosError<{ message?: string }>,
    UpdateAdminProductVariables
  >({
    mutationFn: ({ productId, productData }) =>
      updateProductApi(productId, productData),
    onSuccess: (updatedProduct, variables, context) => {
      // Cập nhật cache cho chi tiết sản phẩm đã sửa
      queryClient.setQueryData(
        productKeys.adminDetail(variables.productId),
        updatedProduct,
      );
      queryClient.setQueryData(
        productKeys.detail(variables.productId),
        updatedProduct,
      ); // Cũng cập nhật cho client view nếu key giống

      // Invalidate danh sách để lấy lại
      queryClient.invalidateQueries({ queryKey: productKeys.adminLists() });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() }); // Cả list của client

      toast.success(`Sản phẩm "${updatedProduct.name}" đã được cập nhật!`);
      options?.onSuccess?.(updatedProduct, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message || "Cập nhật sản phẩm thất bại.",
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// --- Custom Hook: Xóa (Soft Delete) sản phẩm (Admin) ---
export const useDeleteAdminProduct = (
  options?: CustomMutationOptions<{ message: string }, string>, // string là productId
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    AxiosError<{ message?: string }>,
    string
  >({
    mutationFn: deleteProductApi,
    onSuccess: (data, productId, context) => {
      toast.success(data.message || "Sản phẩm đã được xóa (ẩn).");
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
      toast.error(error.response?.data?.message || "Xóa sản phẩm thất bại.");
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, update }) =>
      updateProductStockApi(productId, update),
    onSuccess: (data) => {
      toast.success("Đã cập nhật tồn kho!");
      // Invalidate cả danh sách và chi tiết để làm mới dữ liệu
      queryClient.invalidateQueries({ queryKey: productKeys.adminLists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(data.productId),
      });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Lỗi cập nhật tồn kho."),
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId, update }) =>
      updateVariantStockApi(productId, variantId, update),
    onSuccess: (data) => {
      toast.success("Đã cập nhật tồn kho biến thể!");
      queryClient.invalidateQueries({ queryKey: productKeys.adminLists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(data.productId),
      });
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Lỗi cập nhật tồn kho."),
    ...options,
  });
};
