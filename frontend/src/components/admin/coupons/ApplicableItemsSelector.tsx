"use client";

import useDebounce from "@/hooks/useDebounce";
import { useGetAllCategories } from "@/lib/react-query/categoryQueries";
import { useGetAdminProducts } from "@/lib/react-query/productQueries";
import { ApplicableDetail } from "@/types";
import { cilSearch, cilX } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CFormInput, CSpinner } from "@coreui/react";
import { useEffect, useState } from "react";

interface ApplicableItemsSelectorProps {
  type: "products" | "categories";
  value: string[]; // Mảng các ID đã được chọn
  onChange: (ids: string[]) => void;
  initialDetails?: ApplicableDetail[]; // Vẫn cần để khởi tạo
}

const ApplicableItemsSelector: React.FC<ApplicableItemsSelectorProps> = ({
  type,
  value: selectedIds,
  onChange,
  initialDetails = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // State này sẽ lưu trữ cả ID và tên, giải quyết cả hai vấn đề.
  const [selectedItems, setSelectedItems] = useState<ApplicableDetail[]>([]);

  // useEffect để đồng bộ state nội bộ với props từ form cha
  useEffect(() => {
    // Chỉ cập nhật từ initialDetails nếu state nội bộ đang rỗng
    // và có dữ liệu ban đầu để điền vào (trường hợp sửa coupon)
    if (selectedItems.length === 0 && initialDetails.length > 0) {
      // Lọc ra các chi tiết tương ứng với các ID đã chọn
      const correspondingDetails = initialDetails.filter((detail) =>
        selectedIds.includes(detail._id),
      );
      setSelectedItems(correspondingDetails);
    }
  }, [initialDetails, selectedIds, selectedItems.length]);

  // Fetch dữ liệu tìm kiếm
  const { data: productData, isLoading: isLoadingProducts } =
    useGetAdminProducts(
      { search: debouncedSearchTerm, limit: 10, isActive: true },
      { enabled: type === "products" && debouncedSearchTerm.length > 0 },
    );
  const { data: categoryData, isLoading: isLoadingCategories } =
    useGetAllCategories(
      { name: debouncedSearchTerm, limit: 10, isActive: true },
      { enabled: type === "categories" && debouncedSearchTerm.length > 0 },
    );

  const searchResults: ApplicableDetail[] =
    (type === "products" ? productData?.products : categoryData?.categories) ||
    [];
  const isLoading = isLoadingProducts || isLoadingCategories;

  const handleSelect = (item: ApplicableDetail) => {
    // Kiểm tra trùng lặp dựa trên ID
    if (!selectedItems.some((selected) => selected._id === item._id)) {
      const newSelectedItems = [...selectedItems, item];
      setSelectedItems(newSelectedItems);
      // Gọi onChange của form cha với mảng các ID mới
      onChange(newSelectedItems.map((i) => i._id));
    }
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleRemove = (idToRemove: string) => {
    const newSelectedItems = selectedItems.filter(
      (item) => item._id !== idToRemove,
    );
    setSelectedItems(newSelectedItems);
    // Gọi onChange của form cha với mảng các ID mới
    onChange(newSelectedItems.map((i) => i._id));
  };

  return (
    <div className="mt-3 space-y-3">
      <label className="font-medium text-gray-700">
        {type === "products"
          ? "Chọn sản phẩm áp dụng"
          : "Chọn danh mục áp dụng"}
      </label>

      {/* Hiển thị các item đã chọn */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-gray-50 py-3 px-2">
          {selectedItems.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm"
            >
              <span className="max-w-[200px] truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(item._id)}
                className="rounded-full text-red-500 hover:text-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
                aria-label={`Xóa ${item.name}`}
              >
                <CIcon icon={cilX} size="sm" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ô tìm kiếm */}
      <div className="relative">
        <CIcon
          icon={cilSearch}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
        />
        <CFormInput
          type="search"
          placeholder={`Tìm kiếm ${type === "products" ? "sản phẩm" : "danh mục"}...`}
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
                <CSpinner size="sm" /> Đang tìm...
              </div>
            )}
            {!isLoading &&
              debouncedSearchTerm &&
              searchResults.length === 0 && (
                <div className="p-3 text-center text-gray-500">
                  Không tìm thấy kết quả.
                </div>
              )}
            {searchResults.map((item) => (
              <div
                key={item._id}
                className="cursor-pointer p-3 hover:bg-indigo-50"
                // Dùng onMouseDown để nó chạy trước sự kiện onBlur của input
                onMouseDown={() => handleSelect(item)}
              >
                {item.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicableItemsSelector;
