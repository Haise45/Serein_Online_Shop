import { Category } from "./category";
import { Attribute, AttributeValue } from "./attribute";

// === CẤU TRÚC LỰA CHỌN CỦA BIẾN THỂ ===
export interface VariantOptionValue {
  attribute: string | Attribute; // Có thể là string ID hoặc object Attribute đã populate
  value: string | AttributeValue; // Có thể là string ID hoặc object AttributeValue đã populate
  attributeName?: string;
  valueName?: string;
}

// === CẤU TRÚC BIẾN THỂ ===
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

// === CẤU TRÚC THUỘC TÍNH GÁN VÀO SẢN PHẨM ===
export interface ProductAttribute {
  attribute: string | Attribute; // Có thể là string ID hoặc object Attribute đã populate
  values: string[] | AttributeValue[]; // Có thể là mảng string ID hoặc mảng object AttributeValue đã populate
}

// === CẤU TRÚC SẢN PHẨM ===
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
  images: string[];
  stockQuantity: number;
  isPublished: boolean;
  isActive: boolean;
  attributes: ProductAttribute[];
  variants: Variant[];
  averageRating: number;
  numReviews: number;
  totalSold: number;
  createdAt: string;
  updatedAt: string;

  // Virtuals
  displayPrice: number;
  isOnSale: boolean;
  isConsideredNew: boolean;
}

