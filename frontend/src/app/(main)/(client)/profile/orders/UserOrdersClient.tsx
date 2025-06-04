// src/components/client/orders/UserOrdersClient.tsx
"use client";

import PaginationControls from "@/components/client/product/PaginationControls";
import {
  useGetMyOrders,
  useMarkOrderAsDelivered,
  useRequestCancellation,
  useRequestRefund,
} from "@/lib/react-query/orderQueries";
import { GetMyOrdersParams } from "@/services/orderService";
import { PageSearchParams } from "@/types/next";
import { OrderRequestPayload } from "@/types/order";
import {
  useSearchParams as useNextSearchParamsHook,
  usePathname,
  useRouter,
} from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiLoader } from "react-icons/fi";
import OrderFilters from "@/components/client/orders/OrderFilters";
import OrderList from "@/components/client/orders/OrderList";
import OrderEmptyState from "@/components/client/orders/OrderEmptyState";
import OrderLoadingSkeleton from "@/components/client/orders/OrderLoadingSkeleton";
import OrderActionRequestModal from "@/components/client/orders/OrderActionRequestModal";

const ORDERS_PER_PAGE = 10;

interface UserOrdersClientProps {
  searchParams: PageSearchParams;
}

export default function UserOrdersClient({
  searchParams: initialSearchParams,
}: UserOrdersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentNextSearchParams = useNextSearchParamsHook();

  const [currentPage, setCurrentPage] = useState<number>(
    Number(initialSearchParams?.page) || 1,
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    (initialSearchParams?.status as string) || "",
  );
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [currentOrderForRequest, setCurrentOrderForRequest] = useState<
    string | null
  >(null);
  const [currentRequestType, setCurrentRequestType] = useState<
    "cancellation" | "refund"
  >("cancellation");

  const previousSearchPathRef = useRef<string>(
    currentNextSearchParams.toString(),
  ); // Khởi tạo với giá trị hiện tại

  useEffect(() => {
    const currentSearchPath = currentNextSearchParams.toString();
    if (currentSearchPath !== previousSearchPathRef.current) {
      const pageFromUrl = Number(currentNextSearchParams.get("page")) || 1;
      const statusFromUrl = currentNextSearchParams.get("status") || "";
      if (currentPage !== pageFromUrl) setCurrentPage(pageFromUrl);
      if (statusFilter !== statusFromUrl) setStatusFilter(statusFromUrl);
      previousSearchPathRef.current = currentSearchPath;
    }
  }, [currentNextSearchParams, currentPage, statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", String(currentPage));
    if (statusFilter) params.set("status", statusFilter);
    const newQueryString = params.toString();

    if (newQueryString !== currentNextSearchParams.toString()) {
      router.replace(`${pathname}?${newQueryString}`, { scroll: false });
      previousSearchPathRef.current = newQueryString; // Cập nhật ref sau khi chủ động thay đổi URL
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, pathname, router]); // Bỏ currentNextSearchParams

  const queryParams: GetMyOrdersParams = useMemo(
    () => ({
      page: currentPage,
      limit: ORDERS_PER_PAGE,
      status: statusFilter || undefined,
    }),
    [currentPage, statusFilter],
  );

  const {
    data: ordersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetMyOrders(queryParams);

  const markAsDeliveredMutation = useMarkOrderAsDelivered();
  const [markingDeliveredId, setMarkingDeliveredId] = useState<string | null>(
    null,
  );

  const requestCancellationMutation = useRequestCancellation();
  const requestRefundMutation = useRequestRefund();

  const handleMarkOrderAsDelivered = (orderId: string) => {
    setMarkingDeliveredId(orderId);
    markAsDeliveredMutation.mutate(orderId, {
      onSettled: () => setMarkingDeliveredId(null),
    });
  };

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  }, []);

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleOpenRequestModal = (
    orderId: string,
    type: "cancellation" | "refund",
  ) => {
    setCurrentOrderForRequest(orderId);
    setCurrentRequestType(type);
    setIsRequestModalOpen(true);
  };

  const handleSubmitOrderRequest = async (
    orderId: string,
    payload: OrderRequestPayload,
  ) => {
    try {
      if (currentRequestType === "cancellation") {
        await requestCancellationMutation.mutateAsync({ orderId, payload });
      } else {
        await requestRefundMutation.mutateAsync({ orderId, payload });
      }
      setIsRequestModalOpen(false);
    } catch (submitError) {
      console.error(`Lỗi khi gửi yêu cầu ${currentRequestType}:`, submitError);
    }
  };

  const orderStatusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "Pending", label: "Chờ xác nhận" },
    { value: "Processing", label: "Đang xử lý" },
    { value: "Shipped", label: "Đang giao" },
    { value: "Delivered", label: "Đã giao" },
    { value: "Cancelled", label: "Đã hủy" },
    { value: "Refunded", label: "Đã hoàn tiền" },
    { value: "CancellationRequested", label: "Yêu cầu hủy" },
    { value: "RefundRequested", label: "Yêu cầu hoàn tiền" },
  ];

  // Luôn render bộ lọc
  const filtersComponent = (
    <OrderFilters
      statusFilter={statusFilter}
      onStatusFilterChange={handleStatusFilterChange}
      orderStatusOptions={orderStatusOptions}
    />
  );

  if (isLoading && !ordersData) {
    return (
      <div className="mt-6">
        {filtersComponent}
        <OrderLoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-6">
        {filtersComponent}
        <div className="rounded-md bg-red-50 p-6 text-center">
          <FiAlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 text-base font-medium text-red-600">
            Lỗi tải lịch sử đơn hàng
          </p>
          <p className="mt-1 text-sm text-gray-600">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {filtersComponent}

      {isLoading && ( // Loader khi fetch lại (đã có data cũ)
        <div className="py-4 text-center">
          <FiLoader className="inline h-6 w-6 animate-spin text-indigo-500" />
        </div>
      )}

      {!ordersData || ordersData.orders.length === 0 ? (
        <OrderEmptyState
          statusFilter={statusFilter}
          statusLabel={
            orderStatusOptions.find((opt) => opt.value === statusFilter)?.label
          }
        />
      ) : (
        <>
          <OrderList
            orders={ordersData.orders}
            onMarkAsDelivered={handleMarkOrderAsDelivered}
            isMarkingDelivered={markAsDeliveredMutation.isPending}
            currentMarkingDeliveredId={markingDeliveredId}
            openRequestModal={handleOpenRequestModal}
          />
          <PaginationControls
            currentPage={ordersData.currentPage}
            totalPages={ordersData.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {currentOrderForRequest && (
        <OrderActionRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => {
            if (
              !requestCancellationMutation.isPending &&
              !requestRefundMutation.isPending
            ) {
              setIsRequestModalOpen(false);
            }
          }}
          orderId={currentOrderForRequest}
          actionType={currentRequestType}
          onSubmitRequest={handleSubmitOrderRequest}
          isSubmittingRequest={
            requestCancellationMutation.isPending ||
            requestRefundMutation.isPending
          }
        />
      )}
    </div>
  );
}
