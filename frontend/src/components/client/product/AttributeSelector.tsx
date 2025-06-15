"use client";

import CustomAttributeButton from "./CustomAttributeButton";
import { ProductAttribute } from "@/types/product";
import classNames from "classnames";

interface AttributeSelectorProps {
  attribute: ProductAttribute;
  selectedValue: string | undefined | null;
  onSelectValue: (attributeName: string, value: string | null) => void;
  disabledOptions?: Set<string>;
  isGroupDisabled?: boolean;
  type?: "color" | "text";
}

const AttributeSelector: React.FC<AttributeSelectorProps> = ({
  attribute,
  selectedValue,
  onSelectValue,
  disabledOptions = new Set(),
  isGroupDisabled = false,
  type = "text",
}) => {
  const handleSelection = (optionValue: string) => {
    if (isGroupDisabled) return;

    if (optionValue === selectedValue) {
      onSelectValue(attribute.name, null); // Bỏ chọn
    } else if (!disabledOptions.has(optionValue)) {
      onSelectValue(attribute.name, optionValue); // Chọn mới
    }
  };

  return (
    <div>
      <h3 className="flex items-center text-sm font-medium text-gray-900">
        {attribute.name}
      </h3>
      <div
        className={classNames(
          "mt-2 grid gap-2",
          type === "color"
            ? "grid-cols-6 sm:grid-cols-8 lg:grid-cols-10"
            : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5",
        )}
        role="radiogroup" // Vẫn giữ vai trò cho accessibility
        aria-label={`Chọn ${attribute.name.toLowerCase()}`}
        aria-disabled={isGroupDisabled}
      >
        {attribute.values.map((optionValue) => {
          const isOptionDisabledBySet = disabledOptions.has(optionValue);
          const isEffectivelyDisabled =
            isOptionDisabledBySet || isGroupDisabled;

          return (
            <CustomAttributeButton
              key={optionValue}
              value={optionValue}
              isSelected={selectedValue === optionValue}
              isDisabled={isEffectivelyDisabled}
              onClick={() => handleSelection(optionValue)}
              type={type}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AttributeSelector;
