export interface ColorMeta {
  hex: string;
  borderColor?: string; // Dùng cho các màu sáng như trắng, be
}

// Dữ liệu cho một giá trị thuộc tính (subdocument)
export interface AttributeValue {
  _id: string;
  value: string;
  meta?: Partial<ColorMeta>;
}

// Dữ liệu cho một thuộc tính cha
export interface Attribute {
  _id: string;
  name: string; // key nội bộ, không dấu (vd: 'color')
  slug: string;
  label: string; // Tên hiển thị (vd: 'Màu sắc')
  values: AttributeValue[]; // Mảng các giá trị nhúng
  createdAt?: string;
  updatedAt?: string;
}

// --- Các Type cho việc truyền dữ liệu (DTOs) ---

// Dữ liệu cần để tạo một thuộc tính mới
export type AttributeCreationData = Pick<Attribute, "name" | "label">;

// Dữ liệu cần để tạo một giá trị mới cho thuộc tính
export type AttributeValueCreationData = {
  value: string;
  meta?: Partial<ColorMeta>;
};

// Dữ liệu cần để cập nhật một giá trị
export type AttributeValueUpdateData = Partial<AttributeValueCreationData>;
