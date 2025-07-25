import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSettingsApi } from "@/services/settingService";
import { Setting } from "@/types/setting";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export const useUpdateSettings = () => {
  const t = useTranslations("reactQuery.setting");
  const queryClient = useQueryClient();
  return useMutation<Setting, Error, Partial<Setting>>({
    mutationFn: updateSettingsApi,
    onSuccess: (updatedSettings) => {
      // Cập nhật lại cache của settings
      queryClient.setQueryData(["settings"], updatedSettings);
      toast.success(t("saveSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("saveError"));
    },
  });
};
