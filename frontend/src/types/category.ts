export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent: string | Category | null;
  image?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number;
  // Các thuộc tính ảo được thêm vào ở client-side
  children?: Category[]; // Dùng khi xây dựng cây
  displayName?: string; // Dùng cho select dropdown có thụt lề
}

// Dữ liệu cần thiết để tạo một category mới
export type CategoryCreationData = Pick<
  Category,
  "name" | "description" | "image" | "isActive"
> & {
  parent?: string | null; // ID của parent
};

// Dữ liệu có thể được cập nhật (hầu hết là optional)
export type CategoryUpdateData = Partial<CategoryCreationData>;

export interface GetCategoriesParams {
  // Filtering
  isActive?: boolean;
  parent?: string | null; // Có thể lọc theo danh mục cha
  name?: string; // Lọc theo tên

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedCategoriesResponse {
  currentPage: number;
  totalPages: number;
  totalCategories: number;
  limit: number;
  categories: Category[]; // Mảng chứa dữ liệu danh mục
}
