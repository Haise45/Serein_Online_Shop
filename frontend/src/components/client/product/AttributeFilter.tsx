"use client";
import { ProductFilters } from "@/app/(main)/(client)/products/ProductsPageClient";
import { Attribute } from "@/types";
import classNames from "classnames";
import { FiCheck } from "react-icons/fi";
import FilterDisclosure from "./FilterDisclosure";

interface AttributeFilterProps {
  currentFilters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
  attributes: Attribute[]; // Nhận danh sách thuộc tính từ API
  isLoading: boolean;
}

export default function AttributeFilter({
  currentFilters,
  onFilterChange,
  attributes,
  isLoading,
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

  if (isLoading) {
    return (
      <div className="pt-6">
        <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-gray-200"></div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-md bg-gray-200"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {attributes.map((attr) => {
        // Chỉ render filter nếu thuộc tính có giá trị
        if (attr.values.length === 0) return null;

        // Xử lý đặc biệt cho màu sắc
        if (attr.name === "color") {
          return (
            <FilterDisclosure
              key={attr._id}
              title={attr.label}
              defaultOpen={true}
            >
              <div className="ml-0.5 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-5">
                {attr.values.map((valueOption) => {
                  const isSelected = !!currentFilters.attributes?.[
                    attr.label
                  ]?.includes?.(valueOption.value);
                  const hex = (valueOption.meta?.hex as string) || "#E5E7EB";
                  return (
                    <button
                      key={valueOption._id}
                      type="button"
                      onClick={() =>
                        handleAttributeChange(
                          attr.label,
                          valueOption.value,
                          !isSelected,
                        )
                      }
                      title={valueOption.value}
                      className={classNames(
                        "relative flex h-7 w-7 items-center justify-center rounded-full border border-gray-400 transition-all duration-150 focus:outline-none",
                        {
                          // Khi được chọn, ring sẽ che đi border mặc định
                          "ring-2 ring-indigo-500": isSelected,
                          "hover:scale-110": !isSelected,
                        },
                      )}
                      style={
                        hex.startsWith("linear-gradient")
                          ? { background: hex }
                          : { backgroundColor: hex }
                      }
                      aria-pressed={!!isSelected}
                    >
                      {isSelected && (
                        <FiCheck className="absolute h-5 w-5 text-white mix-blend-difference" />
                      )}
                    </button>
                  );
                })}
              </div>
            </FilterDisclosure>
          );
        }

        // Render mặc định cho các thuộc tính khác (VD: Size)
        return (
          <FilterDisclosure
            key={attr._id}
            title={attr.label}
            defaultOpen={true}
          >
            <div className="grid grid-cols-4 gap-2">
              {attr.values.map((valueOption) => {
                const isSelected = !!currentFilters.attributes?.[
                  attr.label
                ]?.includes?.(valueOption.value);
                return (
                  <button
                    key={valueOption._id}
                    type="button"
                    onClick={() =>
                      handleAttributeChange(
                        attr.label,
                        valueOption.value,
                        !isSelected,
                      )
                    }
                    className={classNames(
                      "flex items-center justify-center rounded-md border px-2 py-1.5 text-xs transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none",
                      isSelected
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    {valueOption.value}
                  </button>
                );
              })}
            </div>
          </FilterDisclosure>
        );
      })}
    </>
  );
}
