"use client";
import "@/app/globals.css";
import { getVariantDisplayNameClient } from "@/lib/utils";
import { PopupNotificationItem } from "@/store/slices/notificationPopupSlice";
import { VariantOptionValue } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { FiCheckCircle, FiX } from "react-icons/fi";

interface AddedToCartPopupProps {
  item: PopupNotificationItem; // item giờ là PopupNotificationItem
  onClose: () => void; // Hàm để xóa popup khỏi store
  attributeMap: Map<string, { label: string; values: Map<string, string> }>;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function AddedToCartPopup({
  item,
  onClose,
  attributeMap,
}: AddedToCartPopupProps) {
  useEffect(() => {
    // Tự động đóng sau 4 giây
    const timer = setTimeout(() => {
      onClose(); // Gọi onClose để xóa khỏi store
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose, item.id]); // Thêm item.id vào dependency để reset timer nếu item thay đổi (ít khả năng)

  // Component này chỉ được render nếu nó có trong mảng popups, nên không cần check !isOpen || !item ở đây nữa

  // Sử dụng hàm helper để lấy tên biến thể
  const variantDisplayName = item.variantInfo
    ? getVariantDisplayNameClient(
        item.variantInfo.options as VariantOptionValue[],
        attributeMap,
      )
    : null;

  const imageUrl =
    item.image && item.image.trim() !== ""
      ? item.image
      : "/placeholder-image.jpg";

  return (
    <div className="animate-slideDownAndFadeIn ring-opacity-5 relative w-80 transform-gpu rounded-lg bg-white p-4 shadow-xl ring-1 ring-gray-300 transition-all duration-300 ease-out sm:w-96">
      <button
        onClick={onClose} // Gọi onClose khi click nút X
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        aria-label="Đóng"
      >
        <FiX className="h-5 w-5" />
      </button>
      <div className="mb-3 flex items-center text-green-600">
        <FiCheckCircle className="mr-2 h-5 w-5 flex-shrink-0" />
        <h2 className="text-base font-semibold">
          Thêm vào giỏ hàng thành công!
        </h2>
      </div>
      <div className="mb-5 flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Image
            src={imageUrl}
            alt={item.name}
            width={64}
            height={64}
            quality={100}
            className="h-16 w-16 rounded border border-gray-200 object-cover object-top"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="line-clamp-2 text-xs font-medium text-gray-800 sm:text-sm">
            {item.name}
          </h3>
          {variantDisplayName && (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 sm:text-xs">
              {variantDisplayName}
            </p>
          )}
          <p className="mt-1 text-xs font-semibold text-indigo-600 sm:text-sm">
            {formatCurrency(item.price)}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
            Số lượng: {item.quantity}
          </p>
        </div>
      </div>
      <div className="flex space-x-2.5">
        <Link
          href="/cart"
          onClick={onClose} // Đóng popup khi chuyển trang
          className="flex-1 items-center justify-center rounded-md border border-indigo-600 px-3 py-2 text-center text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 sm:text-sm"
        >
          Xem Giỏ Hàng
        </Link>
        <button
          onClick={onClose} // Đóng popup khi tiếp tục mua sắm
          className="flex-1 items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:text-sm"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    </div>
  );
}
