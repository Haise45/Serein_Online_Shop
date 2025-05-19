import { Category } from "./category";

export interface VariantOptionValue {
  attributeName: string;
  value: string;
}

export interface Variant {
  _id: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  salePriceEffectiveDate?: string | Date | null;
  salePriceExpiryDate?: string | Date | null;
  stockQuantity: number;
  images?: string[];
  optionValues: VariantOptionValue[];
  displayPrice: number; // Virtual
  isOnSale: boolean; // Virtual
}

export interface ProductAttribute {
  name: string;
  values: string[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  salePriceEffectiveDate?: string | Date | null;
  salePriceExpiryDate?: string | Date | null;
  sku?: string | null;
  category: Category | string;
  images: string[]; // Mảng các URL ảnh chính của sản phẩm
  stockQuantity: number;
  isPublished: boolean;
  isActive: boolean;
  attributes: ProductAttribute[];
  variants: Variant[]; // Sử dụng type Variant đã cập nhật
  averageRating: number;
  numReviews: number;
  totalSold: number;
  createdAt: string;
  updatedAt: string;

  displayPrice: number;
  isOnSale: boolean;
  isNew: boolean;
}

