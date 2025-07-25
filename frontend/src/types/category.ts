// Định nghĩa kiểu cho các trường đa ngôn ngữ
export interface I18nField {
  vi: string;
  en: string;
}

// 1. BaseCategory: Chứa các trường chung, không phụ thuộc vào ngôn ngữ
export interface BaseCategory {
  _id: string;
  slug: string;
  image?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number;
}

// 2. Category (dành cho Client): Dữ liệu đã được "làm phẳng"
export interface Category extends BaseCategory {
  name: string; // Đã được dịch thành string
  description?: string; // Đã được dịch thành string
  parent: Category | string | null; // parent cũng là Category đã được dịch
  // Thuộc tính ảo thêm ở client-side
  children?: Category[];
  displayName?: string;
}

// 3. CategoryAdmin (dành cho Admin): Dữ liệu gốc từ DB
export interface CategoryAdmin extends BaseCategory {
  name: I18nField; // Object đa ngôn ngữ
  description?: I18nField;
  parent: CategoryAdmin | string | null; // parent cũng là CategoryAdmin
}

// 4. Các Type cho Payload và Response
export type CategoryCreationData = {
  name: I18nField;
  description?: I18nField;
  parent?: string | null;
  image?: string;
  isActive?: boolean;
};

export type CategoryUpdateData = Partial<CategoryCreationData>;

export interface GetCategoriesParams {
  isActive?: boolean;
  parent?: string | null;
  name?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Response từ API luôn trả về dữ liệu đã được "làm phẳng" cho client
export interface PaginatedCategoriesResponse {
  currentPage: number;
  totalPages: number;
  totalCategories: number;
  limit: number;
  categories: Category[]; // API luôn trả về Category đã được dịch
}

export interface PaginatedAdminCategoriesResponse {
  currentPage: number;
  totalPages: number;
  totalCategories: number;
  limit: number;
  categories: CategoryAdmin[]; // API luôn trả về Category đã được dịch
}
