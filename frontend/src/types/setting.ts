import { I18nField } from ".";

export interface BannerSlide {
  _id?: string;
  imageUrl: string;
  title: I18nField;
  subtitle: I18nField;
  buttonText: I18nField;
  buttonLink: string;
  isActive: boolean;
}

export interface Setting {
  _id: string;
  key: string;
  clientSettings: {
    defaultLanguage: "vi" | "en";
    defaultCurrency: "VND" | "USD";
  };
  adminSettings: {
    defaultLanguage: "vi" | "en";
    defaultCurrency: "VND" | "USD";
  };
  landingPage: {
    maxFeaturedProducts: number;
    maxNewestProducts: number;
    banners: BannerSlide[];
  };
  productListPage: {
    defaultProductsPerPage: number;
  };
  adminTable: {
    defaultItemsPerPage: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Thêm type cho tỷ giá
export interface ExchangeRates {
  base: "VND"; // Hoặc currency khác nếu bạn mở rộng
  rates: {
    [key: string]: number; // Ví dụ: { 'USD': 0.00004 }
  };
  inverseRates: {
    [key: string]: number; // Ví dụ: { 'USD': 25400 }
  };
}
