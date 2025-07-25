import {
  getAttributesApi,
  createAttribute as createAttributeApi,
  addAttributeValue as addAttributeValueApi,
  updateAttributeValue as updateAttributeValueApi,
  deleteAttributeValue as deleteAttributeValueApi,
  getAdminAttributesApi,
} from "@/services/attributeService";
import {
  Attribute,
  AttributeAdmin,
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
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useLocale } from "next-intl";

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

export const useGetAdminAttributes = (
  options?: CustomQueryOptions<AttributeAdmin[]>,
) => {
  return useQuery<AttributeAdmin[], AxiosError<{ message?: string }>>({
    // Dùng một key riêng để không xung đột cache
    queryKey: [...attributeKeys.lists(), "admin"],
    queryFn: getAdminAttributesApi,
    staleTime: 1000 * 60 * 5, // Admin có thể cần dữ liệu mới hơn
    ...options,
  });
};

// =================================================================
// --- CẬP NHẬT CÁC MUTATION HOOKS Ở ĐÂY ---
// =================================================================

export const useCreateAttribute = (
  options?: CustomMutationOptions<AttributeAdmin, AttributeCreationData>,
) => {
  const t = useTranslations("reactQuery.attribute");
  const queryClient = useQueryClient(); // Lấy queryClient instance
  const locale = useLocale();
  return useMutation({
    mutationFn: createAttributeApi,
    onSuccess: (newAttr, variables, context) => {
      // === BƯỚC QUAN TRỌNG ===
      // Sau khi tạo thành công, làm mới lại query có key là ['attributes', 'list']
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      const localizedLabel =
        newAttr.label[locale as "vi" | "en"] || newAttr.label.vi;
      toast.success(t("createSuccess", { label: localizedLabel }));
      // Gọi lại onSuccess gốc nếu có
      options?.onSuccess?.(newAttr, variables, context);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || t("createError")),
    ...options,
  });
};

export const useAddAttributeValue = (
  options?: CustomMutationOptions<
    AttributeValue,
    { attributeId: string; valueData: AttributeValueCreationData }
  >,
) => {
  const t = useTranslations("reactQuery.attribute");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attributeId, valueData }) =>
      addAttributeValueApi(attributeId, valueData),
    onSuccess: (newValue, variables, context) => {
      // === BƯỚC QUAN TRỌNG ===
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      toast.success(t("addValueSuccess"));
      options?.onSuccess?.(newValue, variables, context);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || t("addValueError")),
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
  const t = useTranslations("reactQuery.attribute");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attributeId, valueId, valueData }) =>
      updateAttributeValueApi(attributeId, valueId, valueData),
    onSuccess: (updatedValue, variables, context) => {
      // === BƯỚC QUAN TRỌNG ===
      queryClient.invalidateQueries({ queryKey: attributeKeys.lists() });
      toast.success(t("updateValueSuccess"));
      options?.onSuccess?.(updatedValue, variables, context);
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || t("updateValueError")),
    ...options,
  });
};

export const useDeleteAttributeValue = (
  options?: CustomMutationOptions<
    { message: string },
    { attributeId: string; valueId: string }
  >,
) => {
  const t = useTranslations("reactQuery.attribute");
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
      toast.error(error.response?.data?.message || t("deleteValueError")),
    ...options,
  });
};
