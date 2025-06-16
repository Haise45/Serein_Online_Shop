import {
  getAttributes as getAttributesApi,
  createAttribute as createAttributeApi,
  addAttributeValue as addAttributeValueApi,
  updateAttributeValue as updateAttributeValueApi,
  deleteAttributeValue as deleteAttributeValueApi,
} from "@/services/attributeService";
import {
  Attribute,
  AttributeCreationData,
  AttributeValue,
  AttributeValueCreationData,
  AttributeValueUpdateData,
} from "@/types";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

// --- Query Keys ---
export const attributeKeys = {
  all: ["attributes"] as const,
  lists: () => [...attributeKeys.all, "list"] as const,
  list: () => [...attributeKeys.lists()] as const,
};

// --- Type cho Options ---
type CustomQueryOptions<TData> = Omit<
  UseQueryOptions<TData, AxiosError<{ message?: string }>>,
  "queryKey" | "queryFn"
>;
type CustomMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<
    TData,
    AxiosError<{ message?: string }>,
    TVariables,
    unknown
  >,
  "mutationFn"
>;

// --- Query Hook ---
export const useGetAttributes = (options?: CustomQueryOptions<Attribute[]>) => {
  return useQuery<Attribute[], AxiosError<{ message?: string }>>({
    queryKey: attributeKeys.list(),
    queryFn: getAttributesApi,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
};

// =================================================================
// --- CẬP NHẬT CÁC MUTATION HOOKS Ở ĐÂY ---
// =================================================================

export const useCreateAttribute = (
  options?: CustomMutationOptions<Attribute, AttributeCreationData>,
) => {
  const queryClient = useQueryClient(); // Lấy queryClient instance
  return useMutation({
    mutationFn: createAttributeApi,
    onSuccess: (newAttr, variables, context) => {
      // === BƯỚC QUAN TRỌNG ===
      // Sau khi tạo thành công, làm mới lại query có key là ['attributes', 'list']
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      toast.success(`Đã tạo thuộc tính "${newAttr.label}"!`);
      // Gọi lại onSuccess gốc nếu có
      options?.onSuccess?.(newAttr, variables, context);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Lỗi khi tạo thuộc tính."),
    ...options,
  });
};

export const useAddAttributeValue = (
  options?: CustomMutationOptions<
    AttributeValue,
    { attributeId: string; valueData: AttributeValueCreationData }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attributeId, valueData }) =>
      addAttributeValueApi(attributeId, valueData),
    onSuccess: (newValue, variables, context) => {
      // === BƯỚC QUAN TRỌNG ===
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      toast.success("Đã thêm giá trị mới!");
      options?.onSuccess?.(newValue, variables, context);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Lỗi khi thêm giá trị."),
    ...options,
  });
};

export const useUpdateAttributeValue = (
  options?: CustomMutationOptions<
    AttributeValue,
    {
      attributeId: string;
      valueId: string;
      valueData: AttributeValueUpdateData;
    }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attributeId, valueId, valueData }) =>
      updateAttributeValueApi(attributeId, valueId, valueData),
    onSuccess: (updatedValue, variables, context) => {
      // === BƯỚC QUAN TRỌNG ===
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      toast.success("Đã cập nhật giá trị!");
      options?.onSuccess?.(updatedValue, variables, context);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật giá trị."),
    ...options,
  });
};

export const useDeleteAttributeValue = (
  options?: CustomMutationOptions<
    { message: string },
    { attributeId: string; valueId: string }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attributeId, valueId }) =>
      deleteAttributeValueApi(attributeId, valueId),
    onSuccess: (data, variables, context) => {
      // === BƯỚC QUAN TRỌNG ===
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      toast.success(data.message);
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Lỗi khi xóa giá trị."),
    ...options,
  });
};
