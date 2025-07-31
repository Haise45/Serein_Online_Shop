// Định nghĩa lại cấu trúc
export interface PriceRangeOption {
  key: string; // Key để tra cứu trong file dịch
  min?: number; // Luôn là VND
  max?: number; // Luôn là VND
}

// Mảng mới, chỉ chứa dữ liệu, không có text
export const PREDEFINED_PRICE_RANGES: PriceRangeOption[] = [
  { key: "all", min: undefined, max: undefined },
  { key: "under100k", max: 99999 },
  { key: "100kTo300k", min: 100000, max: 300000 },
  { key: "300kTo500k", min: 300000, max: 500000 },
  { key: "500kTo1m", min: 500000, max: 1000000 },
  { key: "over1m", min: 1000000 },
];