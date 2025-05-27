// src/app/(main)/order-success/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiCheckCircle } from "react-icons/fi";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <FiCheckCircle className="mx-auto mb-6 h-20 w-20 text-green-500" />
      <h1 className="text-3xl font-bold text-gray-800">Đặt hàng thành công!</h1>
      {orderId && (
        <p className="mt-3 text-lg text-gray-600">
          Mã đơn hàng của bạn là:{" "}
          <span className="font-semibold text-indigo-600">
            #{orderId.toString().slice(-6).toUpperCase()}
          </span>
        </p>
      )}
      <p className="mt-2 text-gray-500">
        Cảm ơn bạn đã mua sắm tại Serein Shop. Chúng tôi sẽ xử lý đơn hàng của
        bạn sớm nhất có thể.
      </p>
      <p className="mt-1 text-gray-500">
        Một email xác nhận với chi tiết đơn hàng đã được gửi đến địa chỉ email
        của bạn.
      </p>
      <div className="mt-8 space-x-4">
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        >
          Tiếp tục mua sắm
        </Link>
        {/* Nếu có cách lấy lại orderId và tracking token ở đây, có thể thêm link theo dõi */}
      </div>
    </div>
  );
}
