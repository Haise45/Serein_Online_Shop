export interface ShippingAddressData { // Dùng cho newShippingAddressData
  fullName: string;
  phone: string;
  street: string;
  communeCode: string;
  communeName: string;
  districtCode: string;
  districtName: string;
  provinceCode: string;
  provinceName: string;
  // countryCode?: string; // Backend có default
}

export interface OrderCreationPayload {
  shippingAddressId?: string; // Nếu user chọn địa chỉ đã lưu
  shippingAddress?: ShippingAddressData; // Nếu user nhập địa chỉ mới hoặc guest
  paymentMethod: string; // 'COD', 'BANK_TRANSFER', etc.
  shippingMethod?: string;
  notes?: string;
  email?: string; // Bắt buộc cho guest
  selectedCartItemIds: string[];
}

export interface OrderRequestPayload { // Dùng cho requestCancellation và requestRefund
  reason: string;
  imageUrls?: string[];
}