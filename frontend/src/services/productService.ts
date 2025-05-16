// src/services/productService.ts
import axiosInstance from "@/lib/axiosInstance"; // Sử dụng axiosInstance đã cấu hình
import { Product, Variant } from "@/types"; // Import type Product

// Interface cho các tham số query khi lấy danh sách sản phẩm
export interface GetProductsParams {
  page?: number;
  limit?: number;
  sortBy?: string; // Ví dụ: 'createdAt', 'price', 'totalSold', 'averageRating'
  sortOrder?: "asc" | "desc";
  category?: string; // Slug của category
  categoryId?: string; // ID của category
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  attributes?: Record<string, string>; // Ví dụ: { "Màu sắc": "Đỏ,Xanh", "Size": "M" }
  isActive?: boolean; // Cho admin
  isPublished?: boolean; // Cho admin
  minRating?: number; // Lọc theo rating
}

// Interface cho response từ API lấy danh sách sản phẩm (nếu có phân trang)
export interface PaginatedProductsResponse {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
  products: Product[];
}

/**
 * Lấy danh sách sản phẩm với các tùy chọn lọc, sắp xếp, phân trang.
 * @param params Các tham số query
 * @returns Promise chứa đối tượng PaginatedProductsResponse
 */
export const getProducts = async (
  params?: GetProductsParams,
): Promise<PaginatedProductsResponse> => {
  try {
    // API backend GET /products sẽ nhận các params này trong req.query
    const response = await axiosInstance.get<PaginatedProductsResponse>(
      "/products",
      { params },
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Lỗi khi lấy danh sách sản phẩm:",
      error.response?.data || error.message,
    );
    // Ném lỗi đã được chuẩn hóa bởi interceptor của axiosInstance hoặc tạo lỗi mới
    throw new Error(
      error.response?.data?.message || "Không thể tải danh sách sản phẩm.",
    );
  }
};

/**
 * Lấy chi tiết một sản phẩm bằng slug hoặc ID.
 * @param idOrSlug ID hoặc Slug của sản phẩm
 * @returns Promise chứa thông tin chi tiết sản phẩm hoặc null nếu không tìm thấy
 */
export const getProductBySlugOrId = async (
  idOrSlug: string,
): Promise<Product | null> => {
  try {
    const response = await axiosInstance.get<Product>(`/products/${idOrSlug}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // Trả về null nếu không tìm thấy
    }
    console.error(
      `Lỗi khi lấy sản phẩm "${idOrSlug}":`,
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message ||
        `Không thể tải thông tin sản phẩm "${idOrSlug}".`,
    );
  }
};

// --- Các hàm cho Admin (ví dụ) ---
// Bạn sẽ cần các type cho ProductCreationData và ProductUpdateData

export interface ProductCreationData
  extends Omit<
    Product,
    | "_id"
    | "createdAt"
    | "updatedAt"
    | "slug"
    | "averageRating"
    | "numReviews"
    | "totalSold"
    | "displayPrice"
    | "isOnSale"
    | "isNew"
  > {
  // Các trường cần thiết khi tạo
  category: string; // ID của category
}

export const createProduct = async (
  productData: ProductCreationData,
): Promise<Product> => {
  try {
    const response = await axiosInstance.post<Product>(
      "/products",
      productData,
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Lỗi khi tạo sản phẩm:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.message || "Tạo sản phẩm thất bại.");
  }
};

export interface ProductUpdateData extends Partial<ProductCreationData> {
  // Các trường có thể cập nhật, ví dụ:
  isActive?: boolean;
  isPublished?: boolean;
  variants?: Variant[]; // Cho phép cập nhật toàn bộ mảng variants
}

export const updateProduct = async (
  productId: string,
  productData: ProductUpdateData,
): Promise<Product> => {
  try {
    const response = await axiosInstance.put<Product>(
      `/products/${productId}`,
      productData,
    );
    return response.data;
  } catch (error: any) {
    console.error(
      `Lỗi khi cập nhật sản phẩm ${productId}:`,
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message ||
        `Cập nhật sản phẩm ${productId} thất bại.`,
    );
  }
};

export const deleteProduct = async (
  productId: string,
): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.delete<{ message: string }>(
      `/products/${productId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error(
      `Lỗi khi xóa sản phẩm ${productId}:`,
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || `Xóa sản phẩm ${productId} thất bại.`,
    );
  }
};

// Thêm các service khác nếu cần (ví dụ: updateStock, ...)
