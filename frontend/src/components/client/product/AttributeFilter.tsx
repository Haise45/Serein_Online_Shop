"use client";
import { ProductFilters } from "@/app/(main)/(client)/products/ProductsPageClient";
import {
  ColorOption,
  FIXED_ATTRIBUTE_NAMES,
  PREDEFINED_COLORS,
  PREDEFINED_SIZES_LETTER,
  PREDEFINED_SIZES_NUMERIC,
  SizeOption,
} from "@/constants/filters";
import classNames from "classnames";
import { FiCheck } from "react-icons/fi";
import FilterDisclosure from "./FilterDisclosure";

interface AttributeFilterProps {
  currentFilters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
  // availableAttributes: Record<string, string[]>; // Có thể dùng để chỉ hiển thị các giá trị có sản phẩm
}

export default function AttributeFilter({
  currentFilters,
  onFilterChange,
}: AttributeFilterProps) {
  const handleAttributeChange = (
    attributeName: string,
    value: string,
    isChecked: boolean,
  ) => {
    const currentAttributeValues =
      currentFilters.attributes?.[attributeName] || [];
    let newAttributeValues: string[];

    if (isChecked) {
      newAttributeValues = [...currentAttributeValues, value];
    } else {
      newAttributeValues = currentAttributeValues.filter((v) => v !== value);
    }

    // Tạo một bản sao của attributes hiện tại
    const updatedAttributes = { ...(currentFilters.attributes || {}) };

    if (newAttributeValues.length > 0) {
      updatedAttributes[attributeName] = newAttributeValues;
    } else {
      // Nếu không còn giá trị nào được chọn cho thuộc tính này, xóa key đó khỏi object
      delete updatedAttributes[attributeName];
    }

    onFilterChange({
      ...currentFilters,
      // Nếu updatedAttributes rỗng, gán undefined, ngược lại gán chính nó
      attributes:
        Object.keys(updatedAttributes).length > 0
          ? updatedAttributes
          : undefined,
    });
  };

  const renderColorOptions = () => (
    <div className="ml-0.5 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-5">
      {PREDEFINED_COLORS.map((color: ColorOption) => {
        const isSelected = !!currentFilters.attributes?.[
          FIXED_ATTRIBUTE_NAMES.COLOR
        ]?.includes?.(color.value);
        return (
          <button
            key={color.value}
            type="button"
            onClick={() =>
              handleAttributeChange(
                FIXED_ATTRIBUTE_NAMES.COLOR,
                color.value,
                !isSelected, // Toggle state
              )
            }
            title={color.name}
            className={classNames(
              "relative flex items-center justify-center rounded-full transition-all duration-150 focus:outline-none",
              "h-7 w-7",
              isSelected
                ? "ring-0 ring-black ring-offset-1 ring-offset-white dark:ring-offset-gray-800" // Offset với màu nền
                : "hover:bg-gray-100 dark:hover:bg-indigo-500", // Hover state cho button cha khi chưa active
            )}
            aria-pressed={!!isSelected} // Thêm aria-pressed cho accessibility
          >
            <span
              className={classNames(
                "h-5 w-5 rounded-full shadow-sm sm:h-6 sm:w-6", // Kích thước của hình tròn màu bên trong
                // Thêm border cho màu trắng/sáng để dễ nhìn trên nền trắng
                color.hex === "#FFFFFF" ||
                  color.hex === "#FFFDD0" ||
                  color.hex === "#FFFFF0" ||
                  color.name.toLowerCase().includes("trắng") ||
                  color.hex.toLowerCase().includes("light")
                  ? "border border-gray-300 dark:border-gray-600"
                  : "border border-transparent", // Border transparent cho các màu khác để giữ kích thước
              )}
              style={
                color.hex.startsWith("linear-gradient")
                  ? { background: color.hex }
                  : { backgroundColor: color.hex }
              }
              aria-hidden="true"
            />
            {isSelected && (
              <FiCheck className="absolute h-5 w-5 text-white mix-blend-difference" />
            )}
          </button>
        );
      })}
    </div>
  );

  const renderSizeOptions = (sizes: SizeOption[], attributeName: string) => (
    <div className="grid grid-cols-4 gap-2">
      {sizes.map((size) => (
        <button
          key={size.name}
          type="button"
          onClick={() =>
            handleAttributeChange(
              attributeName, // "Kích cỡ" hoặc "Kích cỡ số"
              size.name,
              !currentFilters.attributes?.[attributeName]?.includes(size.name),
            )
          }
          className={classNames(
            "flex items-center justify-center rounded-md border px-2 py-1.5 text-xs transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none",
            currentFilters.attributes?.[attributeName]?.includes(size.name)
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
          )}
        >
          {size.name}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <FilterDisclosure title="Màu sắc" defaultOpen={true}>
        {renderColorOptions()}
      </FilterDisclosure>
      <FilterDisclosure title="Kích cỡ (Chữ)" defaultOpen={true}>
        {renderSizeOptions(PREDEFINED_SIZES_LETTER, FIXED_ATTRIBUTE_NAMES.SIZE)}
      </FilterDisclosure>
      <FilterDisclosure title="Kích cỡ (Số)" defaultOpen={false}>
        {" "}
        {/* Mặc định đóng size số */}
        {renderSizeOptions(
          PREDEFINED_SIZES_NUMERIC,
          FIXED_ATTRIBUTE_NAMES.SIZE,
        )}
      </FilterDisclosure>
      {/* Bạn có thể thêm các filter thuộc tính khác ở đây nếu cần,
          lấy danh sách từ availableAttributes và render tương tự */}
    </>
  );
}
