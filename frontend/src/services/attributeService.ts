import axiosInstance from "@/lib/axiosInstance";
import {
  Attribute,
  AttributeCreationData,
  AttributeValue,
  AttributeValueCreationData,
  AttributeValueUpdateData,
} from "@/types";
import { AxiosError } from "axios";

// Helper lấy thông điệp lỗi
const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

// --- API Service Functions ---

export const getAttributes = async (): Promise<Attribute[]> => {
  try {
    const { data } = await axiosInstance.get<Attribute[]>("/attributes");
    return data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Không thể tải danh sách thuộc tính."),
    );
  }
};

export const createAttribute = async (
  attributeData: AttributeCreationData,
): Promise<Attribute> => {
  try {
    const { data } = await axiosInstance.post<Attribute>(
      "/attributes",
      attributeData,
    );
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Tạo thuộc tính thất bại."));
  }
};

export const addAttributeValue = async (
  attributeId: string,
  valueData: AttributeValueCreationData,
): Promise<AttributeValue> => {
  try {
    const { data } = await axiosInstance.post<AttributeValue>(
      `/attributes/${attributeId}/values`,
      valueData,
    );
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Thêm giá trị thất bại."));
  }
};

export const updateAttributeValue = async (
  attributeId: string,
  valueId: string,
  valueData: AttributeValueUpdateData,
): Promise<AttributeValue> => {
  try {
    const { data } = await axiosInstance.put<AttributeValue>(
      `/attributes/${attributeId}/values/${valueId}`,
      valueData,
    );
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Cập nhật giá trị thất bại."));
  }
};

export const deleteAttributeValue = async (
  attributeId: string,
  valueId: string,
): Promise<{ message: string }> => {
  try {
    const { data } = await axiosInstance.delete<{ message: string }>(
      `/attributes/${attributeId}/values/${valueId}`,
    );
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Xóa giá trị thất bại."));
  }
};
