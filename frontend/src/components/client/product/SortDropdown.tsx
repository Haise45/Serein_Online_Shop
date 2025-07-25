"use client";
import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";
import classNames from "classnames";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { useTranslations } from "next-intl";

interface SortOption {
  value: string;
  label: string;
}

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
  const t = useTranslations("SortDropdown");

  const SORT_OPTIONS: SortOption[] = [
    { value: "createdAt-desc", label: t("options.createdAt-desc") },
    { value: "totalSold-desc", label: t("options.totalSold-desc") },
    { value: "price-asc", label: t("options.price-asc") },
    { value: "price-desc", label: t("options.price-desc") },
    { value: "averageRating-desc", label: t("options.averageRating-desc") },
    { value: "name-asc", label: t("options.name-asc") },
    { value: "name-desc", label: t("options.name-desc") },
  ];
  
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
      <div className="relative z-20 w-full sm:w-56">
        <ListboxButton className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-left text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
          <span className="block truncate">{selectedOption.label}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <FiChevronDown
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-gray-300 focus:outline-none sm:text-sm">
            {SORT_OPTIONS.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className={({ focus }) =>
                  classNames(
                    focus ? "bg-indigo-100 text-indigo-700" : "text-gray-900",
                    "relative cursor-default py-2 pr-4 pl-10 select-none",
                  )
                }
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
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                        <FiCheck className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}
