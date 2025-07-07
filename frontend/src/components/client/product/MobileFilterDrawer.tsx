"use client";

import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react";
import { FiX } from "react-icons/fi";
import ProductFiltersSidebar from "./ProductFiltersSidebar";
import { useTranslations } from "next-intl";
import { ProductFilters } from "@/app/[locale]/(main)/(client)/products/ProductsPageClient";
import { Attribute, ExchangeRates } from "@/types";
import { Category } from "@/types/category";

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
  displayCurrency: "VND" | "USD";
  rates: ExchangeRates | null;
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
  displayCurrency,
  rates,
}: MobileFilterDrawerProps) {
  const t = useTranslations("ProductPage");

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        open={isOpen}
        onClose={onClose}
        className="relative z-40 lg:hidden"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/30 transition-opacity duration-300 ease-linear data-[state=closed]:opacity-0"
          aria-hidden="true"
        />

        {/* Drawer Panel */}
        <div className="fixed inset-0 z-40 flex">
          <DialogPanel className="flex max-h-screen w-full max-w-xs transform flex-col overflow-y-auto bg-white shadow-xl transition-transform duration-300 ease-in-out data-[state=closed]:-translate-x-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 pt-5 pb-2">
              <DialogTitle className="text-lg font-medium text-gray-900">
                {t("filterButton")}
              </DialogTitle>
              <button
                type="button"
                className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">{t("closeFilters")}</span>
                <FiX className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Filters Sidebar */}
            <div className="mt-4 px-4">
              <ProductFiltersSidebar
                filters={filters}
                onFilterChange={(newFilters) => {
                  onFilterChange(newFilters);
                }}
                categories={categories}
                isLoadingCategories={isLoadingCategories}
                attributes={attributes}
                isLoadingAttributes={isLoadingAttributes}
                onSearchChange={onSearchChange}
                currentSearchTerm={currentSearchTerm}
                onClearAllFilters={onClearAllFilters}
                displayCurrency={displayCurrency}
                rates={rates}
              />
            </div>

            {/* Footer */}
            <div className="mt-auto px-4 pt-6">
              <button
                onClick={onClose}
                className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                {t("viewResults")}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
}
