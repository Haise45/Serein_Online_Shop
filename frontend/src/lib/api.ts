import { ApiErrorResponse } from "@/types/api";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import axiosInstance from "./axiosInstance";

export const fetchApi = async <T = unknown>( // Generic type T cho data trả về
  endpoint: string,
  options: AxiosRequestConfig = {}, // Dùng AxiosRequestConfig
): Promise<T> => {
  try {
    console.log(
      `[API Call (fetchApi)] ${options.method || "GET"} ${axiosInstance.defaults.baseURL}${endpoint}`,
    );
    if (options.data && !(options.data instanceof FormData)) {
      console.log("[API Call Body (fetchApi)]", options.data);
    }

    const response: AxiosResponse<T> = await axiosInstance({
      url: endpoint,
      ...options,
    });

    console.log(
      `[API Success (fetchApi)] ${options.method || "GET"} ${axiosInstance.defaults.baseURL}${endpoint}`,
      response.data,
    );
    return response.data;
  } catch (err: unknown) {
    const error = err as AxiosError;

    console.error(
      `[API Fetch Error (fetchApi)] ${options.method || "GET"} ${axiosInstance.defaults.baseURL}${endpoint}:`,
      error,
    );

    const apiError: ApiErrorResponse = {
      message:
        (error.response?.data as { message?: string })?.message ||
        error.message ||
        "Đã có lỗi xảy ra.",
    };
    throw apiError;
  }
};

// Bạn cũng có thể để hàm uploadFilesApi ở đây nếu muốn
export const uploadFilesApi = async <T = unknown>(
  endpoint: string,
  formData: FormData,
  // onProgress?: (progressEvent: AxiosProgressEvent) => void // Axios hỗ trợ onUploadProgress
): Promise<T> => {
  try {
    console.log(
      `[API Upload (fetchApi)] POST ${axiosInstance.defaults.baseURL}${endpoint}`,
    );
    const response: AxiosResponse<T> = await axiosInstance.post(
      endpoint,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Axios tự set nếu data là FormData
        },
        // onUploadProgress: onProgress, // Nếu cần theo dõi tiến trình
      },
    );
    console.log(
      `[API Upload Success (fetchApi)] POST ${axiosInstance.defaults.baseURL}${endpoint}`,
      response.data,
    );
    return response.data;
  } catch (err: unknown) {
    const error = err as AxiosError;

    console.error(
      `[API Upload Fetch Error (fetchApi)] POST ${axiosInstance.defaults.baseURL}${endpoint}:`,
      error,
    );

    const apiError: ApiErrorResponse = {
      message:
        (error.response?.data as { message?: string })?.message ||
        error.message ||
        "Upload thất bại.",
    };
    throw apiError;
  }
};
