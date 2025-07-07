"use client";
import { FiFilter } from "react-icons/fi";
import { useTranslations } from "next-intl";

interface MobileFilterButtonProps {
  onClick: () => void;
  activeFilterCount?: number; // Số lượng filter đang được áp dụng (tùy chọn)
}

export default function MobileFilterButton({
  onClick,
  activeFilterCount,
}: MobileFilterButtonProps) {
  const t = useTranslations("ProductPage");

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none lg:hidden" // lg:hidden
    >
      <FiFilter
        className="mr-2 -ml-1 h-5 w-5 text-gray-400"
        aria-hidden="true"
      />
      {t("filterButton")}
      {activeFilterCount && activeFilterCount > 0 && (
        <span className="ml-1.5 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}
