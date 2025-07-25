"use client";
import { ProductFilters } from "@/app/[locale]/(main)/(client)/products/ProductsPageClient";
import { PREDEFINED_PRICE_RANGES, PriceRangeOption } from "@/constants/filters";
import { formatCurrency } from "@/lib/utils";
import { ExchangeRates } from "@/types";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import FilterDisclosure from "./FilterDisclosure";
import { FiTag } from "react-icons/fi";

interface PriceFilterProps {
  currentFilters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
}

export default function PriceFilter({
  currentFilters,
  onFilterChange,
  displayCurrency,
  rates,
}: PriceFilterProps) {
  const t = useTranslations("ProductFilters");
  const tRanges = useTranslations("PriceRanges");

  const [minPriceInput, setMinPriceInput] = useState<string>("");
  const [maxPriceInput, setMaxPriceInput] = useState<string>("");

  const usdToVndRate = rates?.inverseRates.USD || 26000;
  const vndToUsdRate = rates?.rates.USD || 1 / 26000;
  const currencyOptions = { currency: displayCurrency, rates };

  // Đồng bộ state input khi filter từ bên ngoài thay đổi
  useEffect(() => {
    const min = currentFilters.minPrice; // Đây là giá trị VND
    const max = currentFilters.maxPrice;

    if (displayCurrency === "USD") {
      setMinPriceInput(
        min !== undefined ? Math.round(min * vndToUsdRate).toString() : "",
      );
      setMaxPriceInput(
        max !== undefined ? Math.round(max * vndToUsdRate).toString() : "",
      );
    } else {
      setMinPriceInput(min !== undefined ? String(min) : "");
      setMaxPriceInput(max !== undefined ? String(max) : "");
    }
  }, [
    currentFilters.minPrice,
    currentFilters.maxPrice,
    displayCurrency,
    vndToUsdRate,
  ]);

  // Khi người dùng nhấn "Áp dụng"
  const handleApplyPriceRange = () => {
    let newMinVND: number | undefined = undefined;
    let newMaxVND: number | undefined = undefined;

    const min = minPriceInput ? parseInt(minPriceInput, 10) : undefined;
    const max = maxPriceInput ? parseInt(maxPriceInput, 10) : undefined;

    // Luôn chuyển đổi ngược về VND trước khi gửi lên cho component cha
    if (displayCurrency === "USD") {
      if (min !== undefined) newMinVND = Math.round(min * usdToVndRate);
      if (max !== undefined) newMaxVND = Math.round(max * usdToVndRate);
    } else {
      newMinVND = min;
      newMaxVND = max;
    }

    onFilterChange({
      ...currentFilters,
      minPrice: newMinVND,
      maxPrice: newMaxVND,
    });
  };

  // Khi người dùng chọn một khoảng giá có sẵn
  const handleSelectPredefinedRange = (range: PriceRangeOption) => {
    // Giá trị min/max trong range luôn là VND, không cần chuyển đổi
    onFilterChange({
      ...currentFilters,
      minPrice: range.min,
      maxPrice: range.max,
    });
  };

  // Khi người dùng nhấn "Đang giảm giá"
  const handleOnSaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...currentFilters,
      onSale: e.target.checked ? true : undefined,
    });
  };

  // Hàm helper để tạo label hiển thị động
  const getRangeLabel = (range: PriceRangeOption) => {
    // Luôn luôn gọi hàm t() với đầy đủ các biến mà chuỗi yêu cầu
    switch (range.key) {
      case "all":
        return tRanges("all"); // Chuỗi này không có biến
      case "under100k":
        return tRanges("under100k", {
          value: formatCurrency(range.max! + 1, currencyOptions),
        });
      case "over1m":
        return tRanges("over1m", {
          value: formatCurrency(range.min!, currencyOptions),
        });
      case "100kTo300k":
      case "300kTo500k":
      case "500kTo1m":
        return tRanges(range.key, {
          min: formatCurrency(range.min!, currencyOptions),
          max: formatCurrency(range.max!, currencyOptions),
        });
      default:
        return range.key; // Fallback
    }
  };

  return (
    <FilterDisclosure title={t("priceTitle")} defaultOpen={true}>
      <div className="space-y-4">
        <div className="border-b border-gray-200 pb-4">
          <div className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                id="on-sale-filter"
                name="on-sale-filter"
                type="checkbox"
                checked={!!currentFilters.onSale} // Dùng `!!` để chuyển đổi sang boolean
                onChange={handleOnSaleChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label
                htmlFor="on-sale-filter"
                className="flex items-center font-medium text-gray-900"
              >
                <FiTag className="mr-1.5 h-4 w-4 text-red-500" />
                <span className="text-red-700">{t("onSale")}</span>
              </label>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {PREDEFINED_PRICE_RANGES.map((range) => {
            const label = getRangeLabel(range);
            const isSelected =
              currentFilters.minPrice === range.min &&
              currentFilters.maxPrice === range.max;

            return (
              <button
                key={range.key}
                onClick={() => handleSelectPredefinedRange(range)}
                className={classNames(
                  "w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-indigo-100 font-medium text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <span className="absolute top-1/2 left-2 -translate-y-1/2 text-sm text-gray-400">
              {displayCurrency === "USD" ? "$" : ""}
            </span>
            <input
              type="number"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              placeholder={t("fromPlaceholder")}
              className="input-field-sm w-full pl-5"
              min="0"
            />
          </div>
          <span className="text-gray-400">–</span>
          <div className="relative flex-1">
            <span className="absolute top-1/2 left-2 -translate-y-1/2 text-sm text-gray-400">
              {displayCurrency === "USD" ? "$" : ""}
            </span>
            <input
              type="number"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              placeholder={t("toPlaceholder")}
              className="input-field-sm w-full pl-5"
              min="0"
            />
            <span className="absolute top-1/2 right-2 -translate-y-1/2 text-sm text-gray-400">
              {displayCurrency === "VND" ? "đ" : ""}
            </span>
          </div>
        </div>
        <button
          onClick={handleApplyPriceRange}
          className="w-full rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          {t("applyButton")}
        </button>
      </div>
    </FilterDisclosure>
  );
}
