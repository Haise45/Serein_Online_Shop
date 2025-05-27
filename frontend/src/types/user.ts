export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  street: string;
  communeCode: string;
  communeName: string;
  districtCode: string;
  districtName: string;
  provinceCode: string;
  provinceName: string;
  countryCode?: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  phone: string;
  addresses?: Address[];
  isEmailVerified?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Cho response của API lấy profile
export interface UserProfile extends Omit<User, 'addresses'> {
  defaultAddress?: Address | null;
}

// Cho payload cập nhật profile
export interface UpdateUserProfilePayload {
  name?: string;
  email?: string; // Cần kiểm tra unique ở backend nếu thay đổi
  phone?: string; // Cần kiểm tra unique ở backend nếu thay đổi
  password?: string; // Mật khẩu mới (nếu muốn đổi)
  // currentPassword?: string; // Có thể cần mật khẩu hiện tại để đổi email/password
}