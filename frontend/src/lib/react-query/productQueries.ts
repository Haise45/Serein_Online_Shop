import {
  getProductBySlugOrId,
  getProducts,
  GetProductsParams,
  PaginatedProductsResponse,
} from "@/services/productService"; // Import các hàm service
import { Product } from "@/types";
import { useQuery } from "@tanstack/react-query";

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

// --- Custom Hook: Lấy danh sách sản phẩm ---
export const useGetProducts = (
  params?: GetProductsParams,
  options?: { enabled?: boolean },
) => {
  return useQuery<PaginatedProductsResponse, Error>({
    // Định nghĩa kiểu cho data và error
    queryKey: productKeys.list(params), // Sử dụng query key đã định nghĩa
    queryFn: () => getProducts(params), // Hàm gọi API
    enabled: options?.enabled ?? true, // Query sẽ tự động chạy trừ khi enabled = false
    // Các tùy chọn khác:
    staleTime: 5 * 60 * 1000, // Dữ liệu được coi là "stale" sau 5 phút
    // cacheTime: 10 * 60 * 1000, // Dữ liệu bị xóa khỏi cache sau 10 phút không active
    // refetchOnWindowFocus: true, // Mặc định là true
  });
};

// --- Custom Hook: Lấy chi tiết sản phẩm ---
export const useGetProductDetails = (
  idOrSlug: string | undefined,
  options?: { enabled?: boolean },
) => {
  return useQuery<Product | null, Error>({
    queryKey: productKeys.detail(idOrSlug),
    queryFn: () => {
      if (!idOrSlug) return Promise.resolve(null); // Trả về null nếu không có idOrSlug
      return getProductBySlugOrId(idOrSlug);
    },
    enabled: options?.enabled ?? !!idOrSlug, // Chỉ chạy khi có idOrSlug
  });
};

// --- Custom Hooks cho Mutations (Tạo, Sửa, Xóa - ví dụ) ---
// export const useCreateProduct = () => {
//   const queryClient = useQueryClient();
//   return useMutation<Product, Error, ProductCreationData>({
//     mutationFn: createProduct,
//     onSuccess: (newProduct) => {
//       // Làm mất hiệu lực (invalidate) cache của danh sách sản phẩm để nó được fetch lại
//       queryClient.invalidateQueries({ queryKey: productKeys.lists() });
//       // Hoặc có thể cập nhật cache trực tiếp với sản phẩm mới
//       // queryClient.setQueryData(productKeys.detail(newProduct._id), newProduct);
//       toast.success('Sản phẩm đã được tạo thành công!');
//     },
//     onError: (error) => {
//       toast.error(error.message || 'Tạo sản phẩm thất bại.');
//     }
//   });
// };
