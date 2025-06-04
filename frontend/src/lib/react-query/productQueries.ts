import {
  getProductByIdOrSlug,
  getProducts,
  GetProductsParams,
  PaginatedProductsResponse,
} from "@/services/productService"; // Import các hàm service
import { Product } from "@/types";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

// --- Query Keys ---
// Định nghĩa key cho các query để React Query quản lý cache và refetch
export const productKeys = {
  all: ["products"] as const, // Key cho tất cả sản phẩm (dùng cho invalidation)
  lists: () => [...productKeys.all, "list"] as const, // Key cho danh sách chung
  list: (params: GetProductsParams | undefined) =>
    [...productKeys.lists(), params || {}] as const, // Key cho danh sách với params cụ thể
  details: () => [...productKeys.all, "detail"] as const,
  detail: (idOrSlug: string | undefined) =>
    [...productKeys.details(), idOrSlug] as const,
};

// Type cho options của useQuery, cho phép tất cả các options hợp lệ
type CustomProductQueryOptions<TData> = Omit<
  UseQueryOptions<TData, AxiosError<{ message?: string }>>,
  "queryKey" | "queryFn"
>;

// --- Custom Hook: Lấy danh sách sản phẩm ---
export const useGetProducts = (
  params?: GetProductsParams,
  options?: CustomProductQueryOptions<PaginatedProductsResponse>,
) => {
  return useQuery<PaginatedProductsResponse, AxiosError<{ message?: string }>>({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    enabled: options?.enabled ?? true,
    ...options,
  });
};

// --- Custom Hook: Lấy chi tiết sản phẩm ---
export const useGetProductDetails = (
  idOrSlug: string | undefined,
  options?: CustomProductQueryOptions<Product | null>,
) => {
  return useQuery<Product | null, AxiosError<{ message?: string }>>({
    queryKey: productKeys.detail(idOrSlug),
    queryFn: () => {
      if (!idOrSlug) return Promise.resolve(null);
      return getProductByIdOrSlug(idOrSlug);
    },
    enabled: options?.enabled ?? !!idOrSlug,
    ...options,
  });
};
