// src/components/client/AddedToCartPopup.tsx
"use client";
import { CartItem } from "@/types/cart";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { FiCheckCircle, FiX } from "react-icons/fi";
import "@/app/globals.css"; // Đảm bảo bạn đã import globals.css nếu animate-slideDownAndFadeIn ở đó

interface AddedToCartPopupProps {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function AddedToCartPopup({
  item,
  isOpen,
  onClose,
}: AddedToCartPopupProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const imageUrl =
    item.image && item.image.trim() !== ""
      ? item.image
      : "/placeholder-image.jpg";

  return (
    // Thay đổi lớp div bao bọc chính
    <div
      className="fixed top-5 right-5 z-50 w-full max-w-sm transform-gpu transition-all duration-300 ease-out"
      // Thêm style để kiểm soát visibility và animation dựa trên isOpen
      // Bạn có thể tạo một animation mới nếu muốn (ví dụ: animate-fadeInRight)
      // Hiện tại, chúng ta sẽ dựa vào việc component có được render hay không (do !isOpen || !item)
      // và animation animate-slideDownAndFadeIn (nếu bạn định nghĩa nó) sẽ chạy khi nó xuất hiện.
    >
      <div
        // Thêm animate-slideDownAndFadeIn hoặc animation tương tự bạn muốn
        // animate-slideDown có thể không phù hợp với vị trí mới
        className="animate-slideDownAndFadeIn relative rounded-lg bg-white p-5 shadow-xl ring-1 ring-black ring-opacity-5"
      >
        <button
          onClick={onClose}
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
              width={64} // Giảm kích thước ảnh một chút cho popup nhỏ hơn
              height={64}
              className="h-16 w-16 rounded border border-gray-200 object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="line-clamp-2 text-xs font-medium text-gray-800 sm:text-sm">
              {item.name}
            </h3>
            {item.variantInfo && item.variantInfo.options.length > 0 && (
              <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 sm:text-xs">
                {item.variantInfo.options
                  .map((opt) => `${opt.attributeName}: ${opt.value}`)
                  .join(" / ")}
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
            onClick={onClose}
            className="flex-1 rounded-md border border-indigo-600 px-3 py-2 text-center text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 sm:text-sm"
          >
            Xem Giỏ Hàng
          </Link>
          <button
            onClick={onClose}
            className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:text-sm"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
}