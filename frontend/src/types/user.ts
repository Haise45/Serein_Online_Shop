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
  isDefault?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  phone: string;
  addresses?: Address[];
  isEmailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  defaultAddress?: Address | null;
}
