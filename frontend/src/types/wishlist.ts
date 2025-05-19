import { Product, VariantOptionValue } from "./product";

// Thông tin chi tiết của variant được "thích" (nếu có)
export interface WishlistedVariantDetails {
  _id: string;
  sku?: string;
  optionValues: VariantOptionValue[]; // Sử dụng lại type từ Product.Variant
  images: string[];
  price: number;
  salePrice?: number | null;
  displayPrice: number;
  isOnSale: boolean;
  stockQuantity: number;
}

// Type cho một item trong danh sách yêu thích trả về từ API
export interface WishlistItem extends Omit<Product, "variants"> {
  // Kế thừa từ Product nhưng bỏ mảng variants đầy đủ
  wishlistAddedAt?: Date | string; // Thời gian thêm vào wishlist
  wishlistedVariantId?: string | null; // ID của variant đã "thích"
  variantDetails?: WishlistedVariantDetails | null; // Thông tin chi tiết của variant đã "thích"
  // Các trường khác từ Product như name, slug, price, images, category, displayPrice, isOnSale, isNew...
}
