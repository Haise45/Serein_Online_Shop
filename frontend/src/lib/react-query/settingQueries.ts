import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSettingsApi } from "@/services/settingService";
import { Setting } from "@/types/setting";
import toast from "react-hot-toast";

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation<Setting, Error, Partial<Setting>>({
    mutationFn: updateSettingsApi,
    onSuccess: (updatedSettings) => {
      // Cập nhật lại cache của settings
      queryClient.setQueryData(["settings"], updatedSettings);
      toast.success("Cài đặt đã được lưu thành công!");
    },
    onError: (error) => {
      toast.error(error.message || "Lưu cài đặt thất bại.");
    },
  });
};
