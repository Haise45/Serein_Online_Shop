"use client";
import { Listbox, Transition } from "@headlessui/react";
import classNames from "classnames";
import { Fragment } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

interface SortOption {
  value: string; // Ví dụ: "createdAt-desc", "price-asc"
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: "createdAt-desc", label: "Mới nhất" },
  { value: "totalSold-desc", label: "Bán chạy nhất" },
  { value: "price-asc", label: "Giá: Thấp đến Cao" },
  { value: "price-desc", label: "Giá: Cao đến Thấp" },
  { value: "averageRating-desc", label: "Đánh giá cao nhất" },
  { value: "name-asc", label: "Tên: A-Z" },
  { value: "name-desc", label: "Tên: Z-A" },
];

interface SortDropdownProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (newSortBy: string, newSortOrder: "asc" | "desc") => void;
}

export default function SortDropdown({
  sortBy,
  sortOrder,
  onSortChange,
}: SortDropdownProps) {
  const selectedValue = `${sortBy}-${sortOrder}`;
  const selectedOption =
    SORT_OPTIONS.find((opt) => opt.value === selectedValue) || SORT_OPTIONS[0];

  const handleChange = (newValueString: string) => {
    const [newSortBy, newSortOrder] = newValueString.split("-") as [
      string,
      "asc" | "desc",
    ];
    onSortChange(newSortBy, newSortOrder);
  };

  return (
    <Listbox value={selectedValue} onChange={handleChange}>
      <div className="relative w-full sm:w-56 z-20">
        {" "}
        {/* Điều chỉnh độ rộng */}
        <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-left text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
          <span className="block truncate">{selectedOption.label}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <FiChevronDown
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black focus:outline-none sm:text-sm">
            {SORT_OPTIONS.map((option) => (
              <Listbox.Option
                key={option.value}
                className={({ active }) =>
                  classNames(
                    active ? "bg-indigo-100 text-indigo-700" : "text-gray-900",
                    "relative cursor-default py-2 pr-4 pl-10 select-none",
                  )
                }
                value={option.value}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={classNames(
                        selected ? "font-semibold" : "font-normal",
                        "block truncate",
                      )}
                    >
                      {option.label}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                        <FiCheck className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
