import axiosInstance from "@/lib/axiosInstance";
import { ExchangeRates, Setting } from "@/types/setting";

export const getSettingsApi = async (): Promise<Setting> => {
  const { data } = await axiosInstance.get("/settings");
  return data;
};

export const updateSettingsApi = async (
  payload: Partial<Setting>,
): Promise<Setting> => {
  const { data } = await axiosInstance.put("/settings", payload);
  return data;
};

export const getExchangeRatesApi = async (): Promise<ExchangeRates> => {
  const { data } = await axiosInstance.get("/settings/rates");
  return data;
};
