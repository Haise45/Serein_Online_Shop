import axiosInstance from "@/lib/axiosInstance";
import { Category } from "@/types";
import { AxiosError } from "axios";

interface GetCategoriesParams {
  isActive?: boolean;
  parent?: string | null;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const getAllCategories = async (
  params?: GetCategoriesParams,
): Promise<Category[]> => {
  try {
    const response = await axiosInstance.get<Category[]>("api/categories", {
      params,
    });
    return response.data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;
    console.error(
      "Lỗi khi lấy danh sách danh mục:",
      err.response?.data || err.message,
    );
    throw new Error(err.response?.data?.message || "Không thể tải danh mục.");
  }
};

export const getCategoryBySlug = async (
  slug: string,
): Promise<Category | null> => {
  try {
    const { data } = await axiosInstance.get<Category>(`api/categories/${slug}`);
    return data;
  } catch (error: unknown) {
    const err = error as AxiosError<{ message?: string }>;

    if (err.response?.status === 404) {
      return null;
    }

    console.error(
      `Lỗi khi lấy danh mục theo slug "${slug}":`,
      err.response?.data || err.message,
    );
    throw new Error(
      err.response?.data?.message || `Không thể tải danh mục "${slug}".`,
    );
  }
};
