import {
  uploadImagesApi,
  UploadImagesResponse,
} from "@/services/uploadService";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

interface UploadImagesVariables {
  files: File[];
  area: string;
}

type MutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<
    TData,
    AxiosError<{ message?: string }>,
    TVariables,
    unknown
  >,
  "mutationFn"
>;

export const useUploadImages = (
  options?: MutationOptions<UploadImagesResponse, UploadImagesVariables>,
) => {
  return useMutation<
    UploadImagesResponse,
    AxiosError<{ message?: string }>,
    UploadImagesVariables
  >({
    mutationFn: ({ files, area }) => uploadImagesApi(files, area),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Upload ảnh thất bại.",
      );
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
