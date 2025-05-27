import axiosInstance from "@/lib/axiosInstance";
import { Commune, District, Province } from "@/types/location";
import { AxiosError } from "axios";

const getErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as AxiosError<{ message?: string }>;
  return error.response?.data?.message || error.message || fallback;
};

export const getProvincesApi = async (): Promise<Province[]> => {
  try {
    const { data } = await axiosInstance.get<Province[]>(
      "locations/provinces",
    );
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(err, "Không thể tải danh sách tỉnh/thành phố."),
    );
  }
};

export const getDistrictsByProvinceApi = async (
  provinceCode: string,
): Promise<District[]> => {
  try {
    const { data } = await axiosInstance.get<District[]>(
      `locations/districts`,
      { params: { provinceCode } },
    );
    return data;
  } catch (err: unknown) {
    throw new Error(
      getErrorMessage(err, "Không thể tải danh sách quận/huyện."),
    );
  }
};

export const getCommunesByDistrictApi = async (
  districtCode: string,
): Promise<Commune[]> => {
  try {
    const { data } = await axiosInstance.get<Commune[]>(`locations/communes`, {
      params: { districtCode },
    });
    return data;
  } catch (err: unknown) {
    throw new Error(getErrorMessage(err, "Không thể tải danh sách phường/xã."));
  }
};
