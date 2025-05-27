import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  getProvincesApi,
  getDistrictsByProvinceApi,
  getCommunesByDistrictApi,
} from "@/services/locationService";
import { Province, District, Commune } from "@/types/location";
import { AxiosError } from "axios";

type LocationQueryOptions<TData> = Omit<
  UseQueryOptions<TData, AxiosError<{ message?: string }>>,
  "queryKey" | "queryFn"
>;

export const locationKeys = {
  all: ["locations"] as const,
  provinces: () => [...locationKeys.all, "provinces"] as const,
  districts: (provinceCode?: string) =>
    [...locationKeys.all, "districts", provinceCode || "all"] as const,
  communes: (districtCode?: string) =>
    [...locationKeys.all, "communes", districtCode || "all"] as const,
};

export const useGetProvinces = (options?: LocationQueryOptions<Province[]>) => {
  return useQuery<Province[], AxiosError<{ message?: string }>>({
    queryKey: locationKeys.provinces(),
    queryFn: getProvincesApi,
    staleTime: Infinity,
    ...options,
  });
};

export const useGetDistricts = (
  provinceCode: string | undefined,
  options?: LocationQueryOptions<District[]>,
) => {
  return useQuery<District[], AxiosError<{ message?: string }>>({
    queryKey: locationKeys.districts(provinceCode),
    queryFn: () => {
      if (!provinceCode) return Promise.resolve([]); // Không fetch nếu không có provinceCode
      return getDistrictsByProvinceApi(provinceCode);
    },
    enabled: !!provinceCode, // Chỉ fetch khi có provinceCode
    staleTime: Infinity,
    ...options,
  });
};

export const useGetCommunes = (
  districtCode: string | undefined,
  options?: LocationQueryOptions<Commune[]>,
) => {
  return useQuery<Commune[], AxiosError<{ message?: string }>>({
    queryKey: locationKeys.communes(districtCode),
    queryFn: () => {
      if (!districtCode) return Promise.resolve([]);
      return getCommunesByDistrictApi(districtCode);
    },
    enabled: !!districtCode,
    staleTime: Infinity,
    ...options,
  });
};
