// src/app/(main)/products/components/MobileFilterDrawer.tsx
"use client";
import { ProductFilters } from "@/app/(main)/(client)/products/ProductsPageClient";
import { Attribute } from "@/types";
import { Category } from "@/types/category";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { FiX } from "react-icons/fi";
import ProductFiltersSidebar from "./ProductFiltersSidebar";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilters;
  onFilterChange: (newFilters: ProductFilters) => void;
  categories: Category[];
  isLoadingCategories: boolean;
  attributes: Attribute[];
  isLoadingAttributes: boolean;
  onSearchChange: (searchTerm: string) => void;
  currentSearchTerm: string;
  onClearAllFilters: () => void;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  categories,
  isLoadingCategories,
  attributes,
  isLoadingAttributes,
  onSearchChange,
  currentSearchTerm,
  onClearAllFilters,
}: MobileFilterDrawerProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40 lg:hidden" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full" // Trượt từ bên trái
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-xl">
              <div className="flex items-center justify-between border-b px-4 pt-5 pb-2">
                <h2 className="text-lg font-medium text-gray-900">Bộ lọc</h2>
                <button
                  type="button"
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  onClick={onClose}
                >
                  <span className="sr-only">Đóng bộ lọc</span>
                  <FiX className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Filters */}
              <div className="mt-4 px-4">
                <ProductFiltersSidebar
                  filters={filters}
                  onFilterChange={(newFilters) => {
                    onFilterChange(newFilters);
                    // Có thể tự động đóng drawer sau khi áp dụng filter nếu muốn
                    // onClose();
                  }}
                  categories={categories}
                  isLoadingCategories={isLoadingCategories}
                  attributes={attributes}
                  isLoadingAttributes={isLoadingAttributes}
                  onSearchChange={(term) => {
                    onSearchChange(term);
                    // onClose(); // Đóng khi search
                  }}
                  currentSearchTerm={currentSearchTerm}
                  onClearAllFilters={onClearAllFilters}
                />
              </div>
              <div className="mt-auto px-4 pt-6">
                <button
                  onClick={onClose} // Nút này chỉ đóng drawer, filter đã được áp dụng khi thay đổi
                  className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                >
                  Xem kết quả
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
