"use client";

import useDebounce from "@/hooks/useDebounce";
import { useGetAdminCategories } from "@/lib/react-query/categoryQueries";
import { useGetAdminProducts } from "@/lib/react-query/productQueries";
import { getLocalizedName } from "@/lib/utils";
import { ApplicableDetail, CategoryAdmin, ProductAdmin } from "@/types";
import { cilSearch, cilX } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CFormInput, CSpinner } from "@coreui/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface ApplicableItemsSelectorProps {
  type: "products" | "categories";
  value: string[]; // Mảng các ID đã được chọn
  onChange: (ids: string[]) => void;
  initialDetails?: ApplicableDetail[];
}

const ApplicableItemsSelector: React.FC<ApplicableItemsSelectorProps> = ({
  type,
  value: selectedIds,
  onChange,
  initialDetails = [],
}) => {
  const t = useTranslations("AdminCoupons.applicableSelector");
  const locale = useLocale() as "vi" | "en";
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // State để lưu trữ các object đã chọn (bao gồm _id và name)
  const [selectedItems, setSelectedItems] = useState<ApplicableDetail[]>([]);

  // useEffect để đồng bộ state nội bộ với props từ form cha
  useEffect(() => {
    // 1. Nếu mảng ID từ form cha bị rỗng (do reset), xóa sạch các item ở đây
    if (selectedIds.length === 0) {
      setSelectedItems([]);
      return;
    }

    // 2. Nếu có dữ liệu ban đầu (chế độ sửa), điền vào state nội bộ
    // Chỉ chạy một lần khi có initialDetails và state đang rỗng
    if (selectedItems.length === 0 && initialDetails.length > 0) {
      const correspondingDetails = initialDetails.filter((detail) =>
        selectedIds.includes(detail._id),
      );
      setSelectedItems(correspondingDetails);
    }
  }, [selectedIds, initialDetails, selectedItems.length]);

  // Fetch dữ liệu tìm kiếm từ các API admin
  const { data: productData, isLoading: isLoadingProducts } =
    useGetAdminProducts(
      { search: debouncedSearchTerm, limit: 10, isActive: true },
      { enabled: type === "products" && debouncedSearchTerm.length > 0 },
    );

  const { data: categoryData, isLoading: isLoadingCategories } =
    useGetAdminCategories(
      { name: debouncedSearchTerm, limit: 10, isActive: true },
      { enabled: type === "categories" && debouncedSearchTerm.length > 0 },
    );

  const searchResults: ApplicableDetail[] =
    (type === "products"
      ? (productData?.products as ProductAdmin[])
      : (categoryData?.categories as CategoryAdmin[])) || [];

  const isLoading = isLoadingProducts || isLoadingCategories;

  // Xử lý khi người dùng chọn một item từ dropdown
  const handleSelect = (item: ApplicableDetail) => {
    if (!selectedItems.some((selected) => selected._id === item._id)) {
      const newSelectedItems = [...selectedItems, item];
      setSelectedItems(newSelectedItems);
      onChange(newSelectedItems.map((i) => i._id));
    }
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  // Xử lý khi người dùng xóa một item đã chọn
  const handleRemove = (idToRemove: string) => {
    const newSelectedItems = selectedItems.filter(
      (item) => item._id !== idToRemove,
    );
    setSelectedItems(newSelectedItems);
    onChange(newSelectedItems.map((i) => i._id));
  };

  return (
    <div className="mt-3 space-y-3">
      <label className="font-medium text-gray-700">
        {type === "products" ? t("productsLabel") : t("categoriesLabel")}
      </label>

      {/* Hiển thị các item đã chọn */}
      <div className="flex min-h-[52px] flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        {selectedItems.length > 0 ? (
          selectedItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm"
            >
              <span
                className="max-w-[200px] truncate"
                title={getLocalizedName(item.name, locale)}
              >
                {getLocalizedName(item.name, locale)}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item._id)}
                className="flex-shrink-0 rounded-full text-red-400 hover:text-red-700 focus:outline-none"
                aria-label={t("removeAria", {
                  name: getLocalizedName(item.name, locale),
                })}
              >
                <CIcon icon={cilX} size="sm" />
              </button>
            </div>
          ))
        ) : (
          <div className="flex w-full items-center justify-center text-sm text-gray-400">
            {t("noItemSelected")}
          </div>
        )}
      </div>

      {/* Ô tìm kiếm */}
      <div className="relative">
        <CIcon
          icon={cilSearch}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
        />
        <CFormInput
          type="search"
          placeholder={
            type === "products" ? t("searchProducts") : t("searchCategories")
          }
          className="!pl-9"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value) setIsDropdownOpen(true);
            else setIsDropdownOpen(false);
          }}
          onFocus={() => {
            if (searchTerm) setIsDropdownOpen(true);
          }}
          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
        />

        {/* Dropdown kết quả tìm kiếm */}
        {isDropdownOpen && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
            {isLoading && (
              <div className="p-3 text-center text-gray-500">
                <CSpinner size="sm" /> {t("loading")}
              </div>
            )}
            {!isLoading &&
              debouncedSearchTerm &&
              searchResults.length === 0 && (
                <div className="p-3 text-center text-gray-500">
                  {t("noResults")}
                </div>
              )}
            {searchResults.map((item) => (
              <div
                key={item._id}
                className="cursor-pointer p-3 hover:bg-indigo-50"
                onMouseDown={() => handleSelect(item)}
              >
                {getLocalizedName(item.name, locale)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicableItemsSelector;
