export interface LoginCredentials {
  email: string;
  password: string; // Có thể không cần nếu dùng social login sau này
}

export interface LoginResponse {
  message: string;
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  isEmailVerified: boolean;
  accessToken: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string; // Có thể dùng social register không cần password
  phone: string;
}

// Thêm các type khác cho Product, Category, Order, Cart, API Error...
export interface ApiErrorResponse {
  message: string;
  // Thêm các trường lỗi khác nếu backend trả về
  errors?: Record<string, string[]>; // Ví dụ cho lỗi validation
}
