"use client";

import { Category } from "@/types";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import Link from "next/link"; // Đã thêm Link
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import CategoryMenu from "../category/CategoryMenu";

interface SideDrawerProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  categories: (Category & { children?: Category[] })[];
}

export default function SideDrawer({
  isOpen,
  setIsOpen,
  categories,
}: SideDrawerProps) {
  const [activeTopLevelCategory, setActiveTopLevelCategory] = useState<
    (Category & { children?: Category[] }) | null
  >(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && categories.length > 0) {
      if (
        !activeTopLevelCategory ||
        !categories.find((cat) => cat._id === activeTopLevelCategory._id)
      ) {
        setActiveTopLevelCategory(categories[0]);
      }
    }
  }, [isOpen, categories, activeTopLevelCategory]);

  const closeDrawer = () => setIsOpen(false);

  const handleTopLevelCategoryClick = (
    category: Category & { children?: Category[] },
  ) => {
    setActiveTopLevelCategory(category);
  };

  const handleDiscoverClick = () => {
    if (activeTopLevelCategory) {
      router.push(`/products?category=${activeTopLevelCategory.slug}`);
      closeDrawer();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        id="mobile-menu"
        className="relative z-40 md:hidden"
        onClose={setIsOpen}
      >
        <TransitionChild
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/30" />
        </TransitionChild>

        <div className="fixed inset-0 z-40 flex">
          <TransitionChild
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="relative flex w-full max-w-xs flex-col overflow-y-hidden rounded-r-lg bg-white shadow-xl">
              {/* Header: Logo and Close Button */}
              <div className="flex items-center justify-between border-b border-gray-300 px-4 py-6">
                <Link href="/" onClick={closeDrawer} className="inline-block">
                  <span className="text-xl font-bold text-gray-900 italic hover:text-gray-700">
                    SEREIN
                  </span>
                </Link>
                <button
                  type="button"
                  className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
                  onClick={closeDrawer}
                >
                  <span className="sr-only">Đóng menu</span>
                  <FiX className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Top-Level Category Tabs */}
              {categories && categories.length > 0 && (
                <div className="flex border-b border-gray-200 bg-white">
                  {categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => handleTopLevelCategoryClick(category)}
                      className={`flex-1 px-1 py-3 text-center text-sm font-semibold whitespace-nowrap focus:outline-none ${
                        activeTopLevelCategory?._id === category._id
                          ? "border-b-2 border-gray-800 text-gray-900"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {category.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              {/* Content for Active Top-Level Category - Scrollable */}
              <div className="flex-grow overflow-y-auto bg-gray-100 p-4">
                {/* Nền xám cho khu vực cuộn */}
                {activeTopLevelCategory && (
                  <div className="space-y-4 rounded-lg bg-white p-4 shadow">
                    {/* Card trắng bên trong */}
                    {/* "KHÁM PHÁ" Button */}
                    <button
                      onClick={handleDiscoverClick}
                      className="w-full rounded-md bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:outline-none"
                    >
                      KHÁM PHÁ TẤT CẢ{" "}
                      {activeTopLevelCategory.name.toUpperCase()}
                    </button>
                    {/* Sub-Category List */}
                    {activeTopLevelCategory.children &&
                    activeTopLevelCategory.children.length > 0 ? (
                      <div className="pt-2">
                        {/* Thêm khoảng cách nhỏ trên danh sách con */}
                        <CategoryMenu
                          categories={activeTopLevelCategory.children}
                          isMobile={true}
                          onLinkClick={closeDrawer}
                        />
                      </div>
                    ) : (
                      <p className="py-4 text-center text-sm text-gray-500">
                        Không có danh mục con.
                      </p>
                    )}
                  </div>
                )}
                {/* Fallback if no top-level categories or no active category with content */}
                {(!categories ||
                  categories.length === 0 ||
                  !activeTopLevelCategory) &&
                  !(
                    activeTopLevelCategory?.children &&
                    activeTopLevelCategory.children.length > 0
                  ) && (
                    <div className="mt-4 rounded-lg bg-white p-4 shadow">
                      <p className="text-center text-sm text-gray-500">
                        Không có danh mục nào để hiển thị.
                      </p>
                    </div>
                  )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
