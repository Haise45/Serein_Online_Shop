export interface ColorOption {
  name: string;        // Tên hiển thị (ví dụ: "Đỏ")
  value: string;       // Giá trị gửi lên API (ví dụ: "Đỏ", "RED", hoặc mã màu nếu API dùng mã)
  hex: string;         // Mã màu hex để hiển thị swatch
  borderColor?: string; // Màu viền cho các màu sáng (ví dụ: trắng)
}

export const PREDEFINED_COLORS: ColorOption[] = [
  { name: "Đen", value: "Đen", hex: "#000000" },
  { name: "Trắng", value: "Trắng", hex: "#FFFFFF", borderColor: "#A0AEC0" },
  { name: "Xám", value: "Xám", hex: "#A0AEC0" },
  { name: "Xám đậm", value: "Xám đậm", hex: "#4A5568" },
  { name: "Be", value: "Be", hex: "#F5F5DC", borderColor: "#D1C5AC" },

  { name: "Đỏ", value: "Đỏ", hex: "#E53E3E" },
  { name: "Cam", value: "Cam", hex: "#F59E0B" },
  { name: "Vàng", value: "Vàng", hex: "#ECC94B" },
  { name: "Nâu", value: "Nâu", hex: "#A16207" },
  { name: "Hồng", value: "Hồng", hex: "#FBB6CE" },

  { name: "Xanh lá", value: "Xanh lá", hex: "#48BB78" },
  { name: "Xanh lá đậm", value: "Xanh lá đậm", hex: "#276749" },

  { name: "Xanh dương", value: "Xanh dương", hex: "#3182CE" },
  { name: "Xanh lam", value: "Xanh lam", hex: "#4299E1" },
  { name: "Xanh da trời", value: "Xanh da trời", hex: "#63B3ED" },
  { name: "Xanh ngọc", value: "Xanh ngọc", hex: "#AFEEEE", borderColor: "#7ACACA" },
  { name: "Xanh dương đậm", value: "Xanh dương đậm", hex: "#2C5282" },
  { name: "Xanh navy", value: "Xanh navy", hex: "#1A365D" },

  { name: "Tím", value: "Tím", hex: "#805AD5" },
  { name: "Tím than", value: "Tím than", hex: "#4B0082" }, // Indigo
];


export interface SizeOption {
  name: string;  // Tên hiển thị và giá trị gửi đi (ví dụ: "S", "30")
  isNumeric?: boolean; // Đánh dấu nếu là size số
}

export const PREDEFINED_SIZES_LETTER: SizeOption[] = [
  { name: "XS" }, { name: "S" }, { name: "M" }, { name: "L" },
  { name: "XL" }, { name: "2XL" }, { name: "3XL" }, { name: "4XL" },
];

export const PREDEFINED_SIZES_NUMERIC: SizeOption[] = [
  { name: "28", isNumeric: true }, { name: "29", isNumeric: true }, { name: "30", isNumeric: true },
  { name: "31", isNumeric: true }, { name: "32", isNumeric: true }, { name: "33", isNumeric: true },
  { name: "34", isNumeric: true }, { name: "35", isNumeric: true }, { name: "36", isNumeric: true },
  { name: "38", isNumeric: true }, { name: "40", isNumeric: true }, { name: "42", isNumeric: true },
];

export interface PriceRangeOption {
  label: string;
  min?: number;
  max?: number;
}

export const PREDEFINED_PRICE_RANGES: PriceRangeOption[] = [
  { label: "Tất cả giá", min: undefined, max: undefined },
  { label: "Dưới 100.000đ", max: 99999 },
  { label: "100.000đ - 300.000đ", min: 100000, max: 300000 },
  { label: "300.000đ - 500.000đ", min: 300000, max: 500000 },
  { label: "500.000đ - 1.000.000đ", min: 500000, max: 1000000 },
  { label: "Trên 1.000.000đ", min: 1000000 },
];

// Tên các thuộc tính mà bạn muốn hiển thị filter cố định
export const FIXED_ATTRIBUTE_NAMES = {
    COLOR: "Màu sắc",
    SIZE: "Size"
};