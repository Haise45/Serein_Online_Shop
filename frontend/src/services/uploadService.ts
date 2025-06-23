import axiosInstance from "@/lib/axiosInstance";
import { AxiosError } from "axios";

const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

export interface UploadImagesResponse {
  message: string;
  imageUrls: string[];
}
/**
 * Upload multiple images to the backend.
 * @param files Array of File objects to upload.
 * @param area The area/folder symptômes on Cloudinary (e.g., 'order_requests', 'products').
 * @returns Promise<UploadImagesResponse>
 */
export const uploadImagesApi = async (
  files: File[],
  area: string = "general",
): Promise<UploadImagesResponse> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("images", file);
  });

  try {
    // Gửi request POST đến /api/v1/upload/images/:area
    // Axios sẽ tự động set Content-Type là multipart/form-data
    const { data } = await axiosInstance.post<UploadImagesResponse>(
      `/upload/images/${area}`,
      formData,
    );
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Failed to upload images"));
  }
};
