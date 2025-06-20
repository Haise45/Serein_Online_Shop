import {
  addAddressApi,
  deleteAddressApi,
  getAllUsersAdminApi,
  getUserAddressesApi,
  getUserDetailsByIdAdminApi,
  getUserProfileApi,
  setDefaultAddressApi,
  updateAddressApi,
  updateUserProfileApi,
  updateUserStatusAdminApi,
} from "@/services/userService";
import {
  Address,
  PaginatedUsersResponse,
  UpdateUserProfilePayload,
  UserDetailsResponse,
  UserProfile,
} from "@/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

// --- Query Keys for User ---
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: object) => [...userKeys.lists(), params] as const,
  detail: (id: string, params?: object) =>
    [...userKeys.all, "detail", id, params || {}] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  addresses: () => [...userKeys.all, "addresses"] as const,
};

// --- Hook: Lấy thông tin User Profile ---
export const useGetUserProfile = (options?: { enabled?: boolean }) => {
  return useQuery<UserProfile, AxiosError<{ message?: string }>>({
    queryKey: userKeys.profile(),
    queryFn: getUserProfileApi,
    enabled: options?.enabled ?? true, // Thường enable nếu user đã đăng nhập
    staleTime: 1000 * 60 * 5, // 5 phút
  });
};

// --- Hook: Cập nhật User Profile ---
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<
    UserProfile,
    AxiosError<{ message?: string }>,
    UpdateUserProfilePayload
  >({
    mutationFn: updateUserProfileApi,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(userKeys.profile(), updatedProfile);
      // Hoặc invalidate nếu muốn fetch lại toàn bộ
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      toast.success("Cập nhật thông tin thành công!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || error.message || "Cập nhật thất bại.",
      );
    },
  });
};

// --- Hook: Lấy danh sách địa chỉ của User ---
export const useGetUserAddresses = (options?: { enabled?: boolean }) => {
  return useQuery<Address[], AxiosError<{ message?: string }>>({
    queryKey: userKeys.addresses(),
    queryFn: getUserAddressesApi,
    enabled: options?.enabled ?? true,
  });
};

// --- Hook: Thêm địa chỉ mới ---
export const useAddAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Address[],
    AxiosError<{ message?: string }>,
    Omit<Address, "_id" | "isDefault"> & { isDefault?: boolean }
  >({
    mutationFn: addAddressApi,
    onSuccess: (updatedAddresses) => {
      queryClient.setQueryData(userKeys.addresses(), updatedAddresses);
      // Cập nhật lại profile nếu địa chỉ mặc định thay đổi
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      toast.success("Thêm địa chỉ mới thành công!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Thêm địa chỉ thất bại.",
      );
    },
  });
};

// --- Hook: Cập nhật địa chỉ ---
interface UpdateAddressVariables {
  addressId: string;
  addressData: Partial<Omit<Address, "_id">>;
}
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<
    Address[],
    AxiosError<{ message?: string }>,
    UpdateAddressVariables
  >({
    mutationFn: ({ addressId, addressData }) =>
      updateAddressApi(addressId, addressData),
    onSuccess: (updatedAddresses) => {
      queryClient.setQueryData(userKeys.addresses(), updatedAddresses);
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      toast.success("Cập nhật địa chỉ thành công!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Cập nhật địa chỉ thất bại.",
      );
    },
  });
};

// --- Hook: Xóa địa chỉ ---
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<Address[], AxiosError<{ message?: string }>, string>({
    // string là addressId
    mutationFn: deleteAddressApi,
    onSuccess: (updatedAddresses) => {
      queryClient.setQueryData(userKeys.addresses(), updatedAddresses);
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      toast.success("Xóa địa chỉ thành công!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Xóa địa chỉ thất bại.",
      );
    },
  });
};

// --- Hook: Đặt địa chỉ làm mặc định ---
export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<Address[], AxiosError<{ message?: string }>, string>({
    // string là addressId
    mutationFn: setDefaultAddressApi,
    onSuccess: (updatedAddresses) => {
      queryClient.setQueryData(userKeys.addresses(), updatedAddresses);
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      toast.success("Đặt địa chỉ mặc định thành công!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Đặt địa chỉ mặc định thất bại.",
      );
    },
  });
};

// --- Hook: Lấy danh sách User ---
export const useGetAllUsersAdmin = (params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}) => {
  return useQuery<PaginatedUsersResponse, Error>({
    queryKey: userKeys.list(params),
    queryFn: () => getAllUsersAdminApi(params),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 2, // 2 phút
  });
};

export const useGetUserDetailsAdmin = (
  userId: string,
  params: { page?: number; limit?: number },
) => {
  return useQuery<UserDetailsResponse, Error>({
    queryKey: userKeys.detail(userId, params),
    queryFn: () => getUserDetailsByIdAdminApi(userId, params),
    enabled: !!userId,
    placeholderData: (previousData) => previousData,
  });
};

export const useUpdateUserStatusAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string },
    Error,
    {
      userId: string;
      payload: {
        isActive: boolean;
        reason?: string;
        suspensionEndDate?: string | null;
      };
    }
  >({
    mutationFn: ({ userId, payload }) =>
      updateUserStatusAdminApi(userId, payload),
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate toàn bộ danh sách để cập nhật trạng thái
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error) => {
      toast.error(error.message || "Cập nhật trạng thái thất bại.");
    },
  });
};
