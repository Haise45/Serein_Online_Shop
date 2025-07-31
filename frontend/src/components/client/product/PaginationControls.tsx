"use client";

import classNames from "classnames";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useTranslations } from "next-intl";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const t = useTranslations("Pagination");

  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = [];
  const maxPagesToShow = 5; // Số nút trang số tối đa hiển thị (ví dụ: 1 ... 4 5 6 ... 10)
  const sidePages = Math.floor((maxPagesToShow - 3) / 2); // Số trang ở mỗi bên của trang hiện tại, trừ đi trang đầu, cuối và trang hiện tại

  if (totalPages <= maxPagesToShow) {
    // Hiển thị tất cả các trang nếu tổng số trang nhỏ hơn hoặc bằng maxPagesToShow
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    // Logic hiển thị phức tạp hơn với dấu "..."
    pageNumbers.push(1); // Luôn hiển thị trang đầu

    let rangeStart = currentPage - sidePages;
    let rangeEnd = currentPage + sidePages;

    if (rangeStart <= 2) {
      // Gần đầu
      rangeStart = 2;
      rangeEnd = maxPagesToShow - 1;
    } else if (rangeEnd >= totalPages - 1) {
      // Gần cuối
      rangeEnd = totalPages - 1;
      rangeStart = totalPages - maxPagesToShow + 2;
    }

    if (rangeStart > 2) {
      pageNumbers.push(-1); // Dấu hiệu cho "..."
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i > 1 && i < totalPages) {
        // Chỉ thêm các trang ở giữa, không lặp lại trang 1 và trang cuối
        pageNumbers.push(i);
      }
    }

    if (rangeEnd < totalPages - 1) {
      pageNumbers.push(-1); // Dấu hiệu cho "..."
    }

    pageNumbers.push(totalPages); // Luôn hiển thị trang cuối
  }

  const baseButtonClass =
    "relative inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const activeButtonClass =
    "z-10 bg-indigo-50 border-indigo-500 text-indigo-600";
  const inactiveButtonClass = "text-gray-700";
  const ellipsisClass =
    "relative inline-flex items-center px-1.5 py-2 text-sm font-medium text-gray-700 border border-transparent";

  return (
    <nav
      className="mt-8 flex items-center justify-between rounded-md border-t border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6" // Thêm style cho container
      aria-label="Pagination"
    >
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            {t.rich("page", {
              currentPage,
              totalPages,
              bold: (chunks) => <span className="font-medium">{chunks}</span>,
            })}
          </p>
        </div>
        <div>
          <div
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={classNames(
                baseButtonClass,
                inactiveButtonClass,
                "rounded-l-md",
              )}
              aria-label={t("previous")}
            >
              <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only ml-1 sm:not-sr-only">
                {t("previous")}
              </span>
            </button>

            {pageNumbers.map((number, index) =>
              number === -1 ? (
                <span key={`ellipsis-${index}`} className={ellipsisClass}>
                  ...
                </span>
              ) : (
                <button
                  key={number}
                  onClick={() => onPageChange(number)}
                  className={classNames(
                    baseButtonClass,
                    currentPage === number
                      ? activeButtonClass
                      : inactiveButtonClass,
                  )}
                  aria-current={currentPage === number ? "page" : undefined}
                >
                  {number}
                </button>
              ),
            )}

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={classNames(
                baseButtonClass,
                inactiveButtonClass,
                "rounded-r-md",
              )}
              aria-label={t("next")}
            >
              <span className="sr-only mr-1 sm:not-sr-only">{t("next")}</span>
              <FiChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Pagination cho Mobile (đơn giản hơn) */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("previous")}
        </button>
        <p className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500">
          {currentPage} / {totalPages}
        </p>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("next")}
        </button>
      </div>
    </nav>
  );
}
