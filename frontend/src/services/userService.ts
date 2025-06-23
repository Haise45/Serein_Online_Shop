import axiosInstance from "@/lib/axiosInstance";
import {
  Address,
  PaginatedUsersResponse,
  UpdateUserProfilePayload,
  UserDetailsResponse,
  UserProfile,
} from "@/types/user";
import { AxiosError } from "axios";

const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

// === User Profile ===
export const getUserProfileApi = async (): Promise<UserProfile> => {
  try {
    const { data } = await axiosInstance.get<UserProfile>("users/profile");
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Không thể tải thông tin cá nhân."));
  }
};

export const updateUserProfileApi = async (
  payload: UpdateUserProfilePayload,
): Promise<UserProfile> => {
  try {
    const { data } = await axiosInstance.put<UserProfile>(
      "users/profile",
      payload,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Cập nhật thông tin thất bại."));
  }
};

// === User Addresses ===
export const getUserAddressesApi = async (): Promise<Address[]> => {
  try {
    const { data } = await axiosInstance.get<Address[]>("users/addresses");
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Không thể tải danh sách địa chỉ."));
  }
};

export const addAddressApi = async (
  addressData: Omit<Address, "_id" | "isDefault"> & { isDefault?: boolean },
): Promise<Address[]> => {
  try {
    const { data } = await axiosInstance.post<Address[]>(
      "users/addresses",
      addressData,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Thêm địa chỉ mới thất bại."));
  }
};

export const updateAddressApi = async (
  addressId: string,
  addressData: Partial<Omit<Address, "_id">>,
): Promise<Address[]> => {
  try {
    const { data } = await axiosInstance.put<Address[]>(
      `users/addresses/${addressId}`,
      addressData,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Cập nhật địa chỉ thất bại."));
  }
};

export const deleteAddressApi = async (
  addressId: string,
): Promise<Address[]> => {
  try {
    const { data } = await axiosInstance.delete<Address[]>(
      `users/addresses/${addressId}`,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Xóa địa chỉ thất bại."));
  }
};

export const setDefaultAddressApi = async (
  addressId: string,
): Promise<Address[]> => {
  try {
    const { data } = await axiosInstance.put<Address[]>(
      `users/addresses/${addressId}/default`,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Đặt địa chỉ mặc định thất bại."));
  }
};

// === Admin: User Management ===
export const getAllUsersAdminApi = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}): Promise<PaginatedUsersResponse> => {
  try {
    const { data } = await axiosInstance.get<PaginatedUsersResponse>("users", {
      params,
    });
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(err, "Không thể tải danh sách người dùng."),
    );
  }
};

export const updateUserStatusAdminApi = async (
  userId: string,
  payload: {
    isActive: boolean;
    reason?: string;
    suspensionEndDate?: string | null;
  },
): Promise<{ message: string }> => {
  try {
    const { data } = await axiosInstance.put<{ message: string }>(
      `users/${userId}/status`,
      payload,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(err, "Cập nhật trạng thái người dùng thất bại."),
    );
  }
};

export const getUserDetailsByIdAdminApi = async (
  userId: string,
  params?: { page?: number; limit?: number },
): Promise<UserDetailsResponse> => {
  try {
    const { data } = await axiosInstance.get<UserDetailsResponse>(
      `users/${userId}`,
      { params },
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Không thể tải chi tiết người dùng."));
  }
};
