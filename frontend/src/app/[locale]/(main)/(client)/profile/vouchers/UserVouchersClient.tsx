"use client";

import PaginationControls from "@/components/client/product/PaginationControls";
import { useGetCoupons } from "@/lib/react-query/couponQueries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { GetCouponsParams } from "@/services/couponService";
import { Coupon } from "@/types/coupon";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCheck,
  FiCopy,
  FiGift,
  FiLoader,
} from "react-icons/fi";

const VOUCHERS_PER_PAGE = 9;

// Component con để hiển thị một voucher
const VoucherCard: React.FC<{ voucher: Coupon }> = ({ voucher }) => {
  const t = useTranslations("VoucherCard");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard
      .writeText(voucher.code)
      .then(() => {
        setCopied(true);
        toast.success(t("copySuccess", { code: voucher.code }));
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        toast.error(t("copyError", { error: errorMessage }));
      });
  };

  const applicableText = t(`applicable.${voucher.applicableTo}`);

  const getDiscountText = () => {
    if (voucher.discountType === "percentage") {
      return t("discountPercentage", { value: voucher.discountValue });
    }
    return t("discountFixed", { value: formatCurrency(voucher.discountValue) });
  };

  const isExpiredOrInactive =
    !voucher.isActive || new Date(voucher.expiryDate) < new Date();

  const statusText = isExpiredOrInactive
    ? voucher.isActive
      ? t("expired")
      : t("inactive")
    : t("available");

  let utilizeLink = "/products";
  if (
    !isExpiredOrInactive &&
    voucher.applicableDetails &&
    voucher.applicableDetails.length > 0
  ) {
    const firstApplicableDetail = voucher.applicableDetails[0];
    if (voucher.applicableTo === "categories") {
      utilizeLink = `/products?category=${firstApplicableDetail.slug}`;
    } else if (voucher.applicableTo === "products") {
      // Link đến trang chi tiết sản phẩm
      utilizeLink = `/products/${firstApplicableDetail.slug}`;
    }
  }
  return (
    <div
      className={classNames(
        "relative flex flex-col justify-between rounded-lg border-l-4 bg-white p-5 shadow-lg transition-all duration-200 hover:shadow-xl",
        isExpiredOrInactive
          ? "border-gray-300 opacity-60"
          : "border-indigo-500",
      )}
    >
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3
            className={classNames(
              "text-lg font-semibold",
              isExpiredOrInactive ? "text-gray-500" : "text-indigo-700",
            )}
          >
            {voucher.code}
          </h3>
          <span
            className={classNames(
              "rounded-full px-2 py-0.5 text-center text-xs font-medium",
              isExpiredOrInactive
                ? "bg-gray-100 text-gray-600"
                : "bg-green-100 text-green-700",
            )}
          >
            {statusText}
          </span>
        </div>
        <p
          className={classNames(
            "text-sm font-medium",
            isExpiredOrInactive ? "text-gray-600" : "text-gray-800",
          )}
        >
          {getDiscountText()}
        </p>
        {voucher.description && (
          <p className="mt-1 text-xs text-gray-500">{voucher.description}</p>
        )}

        <div className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-xs text-gray-600">
          {voucher.minOrderValue > 0 && (
            <p>
              {t.rich("minOrder", {
                value: formatCurrency(voucher.minOrderValue),
                bold: (chunks) => <span className="font-medium">{chunks}</span>,
              })}
            </p>
          )}

          <p>
            {t.rich("expiryDate", {
              date: formatDate(voucher.expiryDate),
              bold: (chunks) => <span className="font-medium">{chunks}</span>,
            })}
          </p>

          {voucher.maxUsage !== null && voucher.maxUsage !== undefined && (
            <p>
              {t.rich("usesLeft", {
                count: Math.max(0, voucher.maxUsage - voucher.usageCount),
                bold: (chunks) => <span className="font-medium">{chunks}</span>,
              })}
            </p>
          )}

          <p className="italic">{applicableText}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end space-x-3">
        {!isExpiredOrInactive && (
          <Link
            href={utilizeLink}
            className={classNames(
              "rounded-md px-3 py-2 text-center text-xs font-semibold text-white shadow-sm transition-all duration-200 ease-in-out",
              "bg-gradient-to-r from-indigo-600 to-purple-700",
              "hover:-translate-y-0.5 hover:from-indigo-500 hover:to-purple-600 hover:shadow-md",
              "focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white focus:outline-none",
            )}
          >
            {t("useNow")}
          </Link>
        )}
        <button
          onClick={handleCopyCode}
          disabled={isExpiredOrInactive}
          className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          title="Sao chép mã"
        >
          {copied ? (
            <FiCheck className="mr-1.5 h-4 w-4 text-green-500" />
          ) : (
            <FiCopy className="mr-1.5 h-4 w-4" />
          )}
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
    </div>
  );
};

export default function UserVouchersClient() {
  const t = useTranslations("VoucherPage");
  const [currentPage, setCurrentPage] = useState(1);

  const queryParams: GetCouponsParams = useMemo(
    () => ({
      page: currentPage,
      limit: VOUCHERS_PER_PAGE,
      isActive: true, // Luôn lấy các voucher đang active cho trang này
      validNow: true, // Lấy các voucher đang trong thời gian hiệu lực
      sortBy: "expiryDate", // Sắp xếp theo ngày hết hạn gần nhất
      sortOrder: "asc",
    }),
    [currentPage],
  );

  const {
    data: paginatedVoucherData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCoupons(queryParams, {
    placeholderData: (previousData) => previousData, // Cho TanStack Query v5
    staleTime: 1000 * 60 * 2, // Cache 2 phút
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  if (isLoading && !paginatedVoucherData) {
    return (
      <div className="mt-6 grid animate-pulse grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border-l-4 border-indigo-400 bg-white p-5 shadow-lg"
          >
            <div className="mb-2 h-6 w-1/2 rounded bg-gray-300"></div>
            <div className="mb-1 h-4 w-full rounded bg-gray-200"></div>
            <div className="mb-3 h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="mb-1 h-3 w-1/3 rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200"></div>
            <div className="mt-4 ml-auto h-8 w-24 rounded bg-gray-300"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-6 rounded-md bg-red-50 p-6 text-center">
        <FiAlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-base font-medium text-red-600">
          {t("loadingError")}
        </p>
        <p className="mt-1 text-sm text-gray-600">{error?.message}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          {t("retryButton")}
        </button>
      </div>
    );
  }

  if (!paginatedVoucherData || paginatedVoucherData.coupons.length === 0) {
    return (
      <div className="mt-10 text-center">
        <FiGift className="mx-auto h-16 w-16 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-800">
          {t("noVouchersTitle")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{t("noVouchersSubtitle")}</p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {t("exploreButton")}
        </Link>
      </div>
    );
  }

  const { coupons, totalPages, totalCoupons } = paginatedVoucherData;

  return (
    <div className="mt-6">
      <div className="mb-4 text-sm text-gray-600">
        {t.rich("availableCount", {
          count: totalCoupons,
          bold: (chunks) => (
            <span className="font-semibold text-indigo-600">{chunks}</span>
          ),
        })}
      </div>

      {isLoading &&
        paginatedVoucherData && ( // Loader nhỏ khi có data cũ và đang fetch mới
          <div className="py-4 text-center">
            <FiLoader className="inline h-6 w-6 animate-spin text-indigo-500" />
            <span className="ml-2 text-sm text-gray-500">
              {t("loadingVouchers")}
            </span>
          </div>
        )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((voucher) => (
          <VoucherCard key={voucher._id.toString()} voucher={voucher} />
        ))}
      </div>

      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
