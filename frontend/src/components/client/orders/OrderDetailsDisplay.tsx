"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Order } from "@/types/order_model";
import Image from "next/image";
import Link from "next/link";
import {
  FiBox,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiHash,
  FiHome,
  FiPhone,
  FiTag,
  FiUser,
} from "react-icons/fi";
import OrderStatusStepper from "./OrderStatusStepper";

interface OrderDetailsDisplayProps {
  order: Order;
  title?: string; // Ví dụ: "Chi tiết đơn hàng" hoặc "Cảm ơn bạn đã đặt hàng!"
}

export default function OrderDetailsDisplay({
  order,
  title,
}: OrderDetailsDisplayProps) {
  const itemsSubtotal = order.itemsPrice; // itemsPrice từ backend là subtotal của orderItems
  const discount = order.discountAmount;
  const shipping = order.shippingPrice;
  const total = order.totalPrice;

  return (
    <div className="rounded-lg bg-white p-6 shadow-xl sm:p-8 lg:p-10">
      {title && (
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-indigo-600">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Mã đơn hàng của bạn:
            <span className="font-semibold text-gray-700">
              {" "}
              #{order._id.toString().slice(-6).toUpperCase()}
            </span>
          </p>
        </div>
      )}

      <OrderStatusStepper currentStatus={order.status} />

      <div className="mt-8 grid grid-cols-1 items-start gap-6 md:grid-cols-3 lg:gap-8">
        {/* Thông tin giao hàng */}
        <div className="md:col-span-1">
          <h2 className="mb-3 flex items-center border-b border-gray-300 pb-2 text-lg font-semibold text-gray-800 md:text-base lg:text-lg">
            <FiHome className="mr-2 text-indigo-600" /> Địa chỉ giao hàng
          </h2>
          <div className="space-y-1 text-sm text-gray-600 lg:text-base">
            <p className="font-medium text-gray-700">
              {order.shippingAddress.fullName}
            </p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.communeName},{" "}
              {order.shippingAddress.districtName},{" "}
              {order.shippingAddress.provinceName}
            </p>
          </div>
        </div>

        {/* Phương thức thanh toán */}
        <div className="md:col-span-1">
          <h2 className="mb-3 flex items-center border-b border-gray-300 pb-2 text-lg font-semibold text-gray-800 md:text-base lg:text-lg">
            <FiCreditCard className="mr-2 text-indigo-600" /> Thanh toán
          </h2>
          <div className="space-y-1 text-sm text-gray-600 lg:text-base">
            <p>
              Phương thức:{" "}
              <span className="font-medium text-gray-700">
                {order.paymentMethod === "COD"
                  ? "Thanh toán khi nhận hàng"
                  : order.paymentMethod === "BANK_TRANSFER"
                    ? "Chuyển khoản ngân hàng"
                    : order.paymentMethod}
              </span>
            </p>
            <p>
              Trạng thái:{" "}
              {order.isPaid ? (
                <span className="font-medium text-green-600">
                  Đã thanh toán ({formatDate(order.paidAt)})
                </span>
              ) : (
                <span className="font-medium text-orange-500">
                  Chưa thanh toán
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Thông tin khác */}
        <div className="md:col-span-1">
          <h2 className="mb-3 flex items-center border-b border-gray-300 pb-2 text-lg font-semibold text-gray-800 md:text-base lg:text-lg">
            <FiFileText className="mr-2 text-indigo-600" /> Thông tin đơn hàng
          </h2>
          <div className="space-y-1 text-sm text-gray-600 lg:text-base">
            <p className="flex items-center">
              <FiHash className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
              Mã ĐH:{" "}
              <span className="ml-1 font-medium text-gray-700">
                #{order._id.toString().slice(-6).toUpperCase()}
              </span>
            </p>
            <p className="flex items-center">
              <FiCalendar className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
              Ngày đặt:{" "}
              <span className="ml-1 font-medium text-gray-700">
                {formatDate(order.createdAt)}
              </span>
            </p>
            {order.user && typeof order.user !== "string" && (
              <>
                <p className="flex items-center">
                  <FiUser className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                  Người đặt:{" "}
                  <span className="ml-1 font-medium text-gray-700">
                    {order.user.name}
                  </span>
                </p>
                <p className="flex items-center">
                  <FiPhone className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                  SĐT:{" "}
                  <span className="ml-1 font-medium text-gray-700">
                    {order.user.phone || "Chưa cập nhật"}
                  </span>
                </p>
              </>
            )}
            {!order.user && order.guestOrderEmail && (
              <p className="flex items-center">
                <FiUser className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                Email khách:{" "}
                <span className="ml-1 font-medium text-gray-700">
                  {order.guestOrderEmail}
                </span>
              </p>
            )}
            {order.notes && (
              <p className="mt-2 border-t border-gray-300 pt-2 text-sm">
                Ghi chú: {order.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="mt-8 sm:mt-10">
        <h2 className="mb-4 flex items-center border-b border-gray-300 pb-2 text-lg font-semibold text-gray-800">
          <FiBox className="mr-2 text-indigo-600" /> Sản phẩm đã đặt
        </h2>
        <ul
          role="list"
          className="divide-y divide-gray-300 border-b border-gray-200"
        >
          {order.orderItems.map((item) => (
            <li key={item._id.toString()} className="flex py-4 sm:py-6">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 sm:h-24 sm:w-24">
                <Image
                  src={item.image || "/placeholder-image.jpg"}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="ml-4 flex flex-1 flex-col sm:ml-6">
                <div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <h3 className="pr-2 font-medium text-gray-800">
                      <Link
                        href={`/products/${typeof item.product === "object" && item.product ? item.product.slug : "#"}`}
                        className="line-clamp-2 hover:text-indigo-600"
                      >
                        {item.name}
                      </Link>
                    </h3>
                    <p className="ml-4 font-medium whitespace-nowrap text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                  {item.variant?.options && item.variant.options.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                      {item.variant.options
                        .map((opt) => `${opt.attributeName}: ${opt.value}`)
                        .join(" / ")}
                      {item.variant.sku && ` (SKU: ${item.variant.sku})`}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                    Số lượng: {item.quantity}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                    Đơn giá: {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Tóm tắt chi phí */}
      <div className="mt-8 sm:mt-10">
        <div className="rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:p-8">
          <h2 className="sr-only">Tóm tắt chi phí</h2>
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">Tạm tính</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatCurrency(itemsSubtotal)}
              </dd>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between">
                <dt className="flex items-center text-sm text-green-600">
                  <FiTag className="mr-1.5 h-4 w-4" />
                  <span>
                    Giảm giá{" "}
                    {order.appliedCouponCode && `(${order.appliedCouponCode})`}
                  </span>
                </dt>
                <dd className="text-sm font-medium text-green-600">
                  -{formatCurrency(discount)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">Phí vận chuyển</dt>
              <dd className="text-sm font-medium text-gray-900">
                {shipping > 0 ? formatCurrency(shipping) : "Miễn phí"}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-300 pt-4">
              <dt className="text-base font-bold text-gray-900">Tổng cộng</dt>
              <dd className="text-base font-bold text-gray-900">
                {formatCurrency(total)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-x-3 gap-y-3">
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-6 py-3 text-center text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
        >
          Tiếp tục mua sắm
        </Link>
        {order.user && typeof order.user !== "string" && (
          <Link
            href="/profile/orders"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
          >
            Xem đơn hàng của tôi
          </Link>
        )}
      </div>
    </div>
  );
}
