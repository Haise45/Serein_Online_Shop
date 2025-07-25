import axiosInstance from "@/lib/axiosInstance";
import { Product, ProductAdmin, Variant } from "@/types";
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

export interface PaginatedAdminProductsResponse {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
  products: ProductAdmin[];
}

// Type cho một VariantOptionValue khi tạo/cập nhật (chứa string ID)
export type VariantOptionValueCreation = {
  attribute: string; // ObjectId của Attribute
  value: string; // ObjectId của AttributeValue
};

// Type cho một Variant khi tạo/cập nhật
export type VariantCreationData = Omit<
  Variant,
  "_id" | "displayPrice" | "isOnSale" | "optionValues"
> & {
  optionValues: VariantOptionValueCreation[];
};

// Type cho một ProductAttribute khi tạo/cập nhật
export type ProductAttributeCreation = {
  attribute: string; // ObjectId của Attribute
  values: string[]; // Mảng ObjectId của các AttributeValue
};

export interface StockUpdateResponse {
  productId: string;
  variantId?: string;
  newStockQuantity: number;
}

// Type chính cho dữ liệu tạo sản phẩm
export interface ProductCreationData
  extends Omit<
    ProductAdmin,
    | "_id"
    | "createdAt"
    | "updatedAt"
    | "slug"
    | "averageRating"
    | "numReviews"
    | "totalSold"
    | "displayPrice"
    | "isOnSale"
    | "isConsideredNew"
    | "variants"
    | "attributes"
  > {
  category: string; // ObjectId của Category
  attributes: ProductAttributeCreation[];
  variants: VariantCreationData[];
}

// Type cho dữ liệu cập nhật sản phẩm
export interface ProductUpdateData extends Partial<ProductCreationData> {
  isActive?: boolean;
  isPublished?: boolean;
}

// --- Utils ---

const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

// --- API Services ---
// === API Services cho CLIENT (Người dùng thông thường) ===
export const getProducts = async (
  params?: GetProductsParams,
): Promise<PaginatedProductsResponse> => {
  try {
    const response = await axiosInstance.get<PaginatedProductsResponse>(
      "products",
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
    const response = await axiosInstance.get<Product>(`products/${idOrSlug}`);
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

// === API Services cho ADMIN ===
export const getAdminProductsApi = async (
  params: GetProductsParams,
): Promise<PaginatedAdminProductsResponse> => {
  const { data } = await axiosInstance.get("/products/admin", { params });
  return data;
};

export const createProduct = async (
  productData: ProductCreationData,
): Promise<ProductAdmin> => {
  try {
    const response = await axiosInstance.post<ProductAdmin>(
      "products",
      productData,
    );
    return response.data;
  } catch (err: unknown) {
    console.error("Lỗi khi tạo sản phẩm:", err);
    throw new Error(getErrorMessage(err, "Tạo sản phẩm thất bại."));
  }
};

export const getAdminProductDetailsApi = async (
  productId: string,
): Promise<ProductAdmin> => {
  const { data } = await axiosInstance.get<ProductAdmin>(
    `/products/admin/${productId}`,
  );
  return data;
};

export const updateProduct = async (
  productId: string,
  productData: ProductUpdateData,
): Promise<ProductAdmin> => {
  try {
    const response = await axiosInstance.put<ProductAdmin>(
      `products/${productId}`,
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
      `products/${productId}`,
    );
    return response.data;
  } catch (err: unknown) {
    console.error(`Lỗi khi xóa sản phẩm ${productId}:`, err);
    throw new Error(
      getErrorMessage(err, `Xóa sản phẩm ${productId} thất bại.`),
    );
  }
};

// Cập nhật tồn kho cho sản phẩm không có biến thể
export const updateProductStockApi = async (
  productId: string,
  update: { change?: number; set?: number },
): Promise<StockUpdateResponse> => {
  try {
    const { data } = await axiosInstance.put<StockUpdateResponse>(
      `/products/${productId}/stock`,
      update,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Cập nhật tồn kho thất bại."));
  }
};

// Cập nhật tồn kho cho một biến thể cụ thể
export const updateVariantStockApi = async (
  productId: string,
  variantId: string,
  update: { change?: number; set?: number },
): Promise<StockUpdateResponse> => {
  try {
    const { data } = await axiosInstance.put<StockUpdateResponse>(
      `/products/${productId}/variants/${variantId}/stock`,
      update,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(err, "Cập nhật tồn kho biến thể thất bại."),
    );
  }
};
