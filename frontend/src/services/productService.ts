import axiosInstance from "@/lib/axiosInstance";
import { Product, Variant } from "@/types";
import { AxiosError } from "axios";

// --- Interfaces ---

export interface GetProductsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  category?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  attributes?: Record<string, string>;
  isActive?: boolean;
  isPublished?: boolean;
  minRating?: number;
}

export interface PaginatedProductsResponse {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
  products: Product[];
}

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
  category: string;
}

export interface ProductUpdateData extends Partial<ProductCreationData> {
  isActive?: boolean;
  isPublished?: boolean;
  variants?: Variant[];
}

// --- Utils ---

const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

// --- API Services ---

export const getProducts = async (
  params?: GetProductsParams,
): Promise<PaginatedProductsResponse> => {
  try {
    const response = await axiosInstance.get<PaginatedProductsResponse>(
      "/products",
      { params },
    );
    return response.data;
  } catch (err: unknown) {
    console.error("Lỗi khi lấy danh sách sản phẩm:", err);
    throw new Error(getErrorMessage(err, "Không thể tải danh sách sản phẩm."));
  }
};

export const getProductByIdOrSlug = async (
  idOrSlug: string,
): Promise<Product | null> => {
  try {
    const response = await axiosInstance.get<Product>(`/products/${idOrSlug}`);
    return response.data;
  } catch (err: unknown) {
    const error = err as AxiosError;
    if (error.response?.status === 404) return null;
    console.error(`Lỗi khi lấy sản phẩm "${idOrSlug}":`, err);
    throw new Error(
      getErrorMessage(err, `Không thể tải thông tin sản phẩm "${idOrSlug}".`),
    );
  }
};

export const createProduct = async (
  productData: ProductCreationData,
): Promise<Product> => {
  try {
    const response = await axiosInstance.post<Product>(
      "/products",
      productData,
    );
    return response.data;
  } catch (err: unknown) {
    console.error("Lỗi khi tạo sản phẩm:", err);
    throw new Error(getErrorMessage(err, "Tạo sản phẩm thất bại."));
  }
};

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
  } catch (err: unknown) {
    console.error(`Lỗi khi cập nhật sản phẩm ${productId}:`, err);
    throw new Error(
      getErrorMessage(err, `Cập nhật sản phẩm ${productId} thất bại.`),
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
  } catch (err: unknown) {
    console.error(`Lỗi khi xóa sản phẩm ${productId}:`, err);
    throw new Error(
      getErrorMessage(err, `Xóa sản phẩm ${productId} thất bại.`),
    );
  }
};
