export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent: string | Category | null; // Có thể là ID hoặc object Category đã populate
  image?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  children?: Category[]; // Dùng khi xây dựng cây
  displayName?: string; // Dùng cho select dropdown có thụt lề
}
