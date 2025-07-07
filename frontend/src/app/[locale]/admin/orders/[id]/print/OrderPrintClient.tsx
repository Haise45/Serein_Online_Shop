"use client";

import { useSettings } from "@/app/SettingsContext";
import { useGetOrderById } from "@/lib/react-query/orderQueries";
import { formatCurrency, maskString } from "@/lib/utils";
import { User } from "@/types";
import { CSpinner } from "@coreui/react";
import Image from "next/image";
import React, { useEffect } from "react";

interface OrderPrintClientProps {
  orderId: string;
}

const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME || "Serein Shop";
const SHOP_ADDRESS =
  process.env.NEXT_PUBLIC_SHOP_ADDRESS ||
  "123 Đường ABC, Phường X, Quận Y, TP.HCM";
const SHOP_PHONE = process.env.NEXT_PUBLIC_SHOP_PHONE || "0909.123.456";
const SHOP_EMAIL = process.env.NEXT_PUBLIC_SHOP_EMAIL || "hotro@serein.com";

const OrderPrintClient: React.FC<OrderPrintClientProps> = ({ orderId }) => {
  // *** SỬ DỤNG CONTEXT ĐỂ LẤY THÔNG TIN TIỀN TỆ ***
  const { displayCurrency, rates } = useSettings();
  const { data: order, isLoading, isError } = useGetOrderById(orderId);

  useEffect(() => {
    if (order && !isLoading) {
      // Đợi một chút để đảm bảo DOM đã render xong trước khi in
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [order, isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <CSpinner /> <span className="ml-3">Đang tải dữ liệu đơn hàng...</span>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        Lỗi: Không thể tải dữ liệu để in. Vui lòng đóng cửa sổ này và thử lại.
      </div>
    );
  }

  const orderUser =
    order.user && typeof order.user === "object" ? (order.user as User) : null;

  const customerName = orderUser
    ? orderUser.name
    : order.shippingAddress.fullName;
  const customerEmail = orderUser ? orderUser.email : order.guestOrderEmail;
  const customerPhone = order.shippingAddress.phone;
  const fullAddress = [
    order.shippingAddress.street,
    order.shippingAddress.communeName,
    order.shippingAddress.districtName,
    order.shippingAddress.provinceName,
  ].join(", ");

  const maskedEmail = customerEmail
    ? maskString(customerEmail.split("@")[0], 2, 1) +
      "@" +
      customerEmail.split("@")[1]
    : "N/A";
  const maskedPhone = customerPhone ? maskString(customerPhone, 3, 3) : "N/A";

  return (
    <div className="print-container bg-white p-6 font-sans text-xs text-gray-900 md:p-8">
      {/* Header */}
      <header className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-wider uppercase">
            {SHOP_NAME}
          </h1>
          <p className="mt-1">{SHOP_ADDRESS}</p>
          <p>Hotline: {SHOP_PHONE}</p>
          <p>Email: {SHOP_EMAIL}</p>
          <p>Website: online-store-delta-seven.vercel.app</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold">PHIẾU GIAO HÀNG</h2>
          <p className="mt-2">
            Mã đơn hàng:{" "}
            <span className="text-base font-semibold">
              #{order._id.slice(-6).toUpperCase()}
            </span>
          </p>
          <p>Ngày đặt: {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
        </div>
      </header>

      {/* Thông tin */}
      <section className="my-4 grid grid-cols-2 gap-6">
        <div>
          <h3 className="mb-2 border-b border-gray-300 pb-1 font-bold">
            THÔNG TIN NGƯỜI NHẬN
          </h3>
          <p>
            <strong>Tên:</strong> {customerName}
          </p>
          <p>
            <strong>Điện thoại:</strong> {maskedPhone}
          </p>
          <p>
            <strong>Địa chỉ:</strong> {fullAddress}
          </p>
        </div>
        <div>
          <h3 className="mb-2 border-b border-gray-300 pb-1 font-bold">
            THÔNG TIN ĐƠN HÀNG
          </h3>
          <p>
            <strong>Thanh toán:</strong>{" "}
            {{
              COD: "Thanh toán khi nhận hàng (COD)",
              BANK_TRANSFER: "Chuyển khoản ngân hàng",
              PAYPAL: "Thanh toán bằng PayPal",
            }[order.paymentMethod] || order.paymentMethod}
          </p>
          {customerEmail && (
            <p>
              <strong>Email:</strong> {maskedEmail}
            </p>
          )}
          {order.notes && (
            <p>
              <strong>Ghi chú:</strong> {order.notes}
            </p>
          )}
        </div>
      </section>

      {/* Bảng sản phẩm */}
      <section className="my-4">
        <h3 className="mb-2 font-bold">CHI TIẾT SẢN PHẨM</h3>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-y border-gray-300 bg-gray-100">
              <th className="p-2 font-semibold" style={{ width: "50px" }}>
                Ảnh
              </th>
              <th className="p-2 font-semibold">Sản phẩm</th>
              <th className="p-2 font-semibold" style={{ width: "120px" }}>
                SKU
              </th>
              <th
                className="p-2 text-center font-semibold"
                style={{ width: "50px" }}
              >
                SL
              </th>
              <th
                className="p-2 text-right font-semibold"
                style={{ width: "100px" }}
              >
                Đơn giá
              </th>
              <th
                className="p-2 text-right font-semibold"
                style={{ width: "110px" }}
              >
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {order.orderItems.map((item) => {
              const variantDisplayName = item.variant?.options
                ?.map((opt) => opt.value)
                .join(" / ");
              return (
                <tr key={item._id} className="border-b border-gray-200">
                  <td className="p-2">
                    <Image
                      src={item.image || "/placeholder-image.jpg"}
                      alt={item.name}
                      width={40}
                      height={40}
                      quality={100}
                      className="aspect-square rounded border object-cover object-top"
                    />
                  </td>
                  <td className="p-2">
                    <div className="font-medium">{item.name}</div>
                    {variantDisplayName && (
                      <div className="text-gray-500">{variantDisplayName}</div>
                    )}
                  </td>
                  <td className="p-2">
                    <code>{item.variant?.sku || "N/A"}</code>
                  </td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-right">
                    {formatCurrency(item.price, {
                      currency: displayCurrency,
                      rates,
                    })}
                  </td>
                  <td className="p-2 text-right font-semibold">
                    {formatCurrency(item.price * item.quantity, {
                      currency: displayCurrency,
                      rates,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Tổng kết */}
      <section className="my-4 flex justify-end">
        <div className="w-full max-w-sm space-y-1">
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>
              {formatCurrency(order.itemsPrice, {
                currency: displayCurrency,
                rates,
              })}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Giảm giá ({order.appliedCouponCode}):</span>
              <span className="text-green-600">
                -
                {formatCurrency(order.discountAmount, {
                  currency: displayCurrency,
                  rates,
                })}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span>
              {formatCurrency(order.shippingPrice, {
                currency: displayCurrency,
                rates,
              })}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-black pt-2 text-base font-bold">
            <span>TỔNG CỘNG:</span>
            <span>
              {formatCurrency(order.totalPrice, {
                currency: displayCurrency,
                rates,
              })}
            </span>
          </div>
          {order.paymentMethod === "COD" && (
            <div className="mt-2 rounded bg-gray-200 p-2 text-center">
              <span className="font-semibold">
                Tiền thu hộ (COD):{" "}
                {formatCurrency(order.totalPrice, {
                  currency: displayCurrency,
                  rates,
                })}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Chân trang */}
      <footer className="mt-4 border-t border-gray-300 pt-3.5 text-center text-gray-500">
        <p>Cảm ơn quý khách đã tin tưởng và mua hàng tại Serein Shop!</p>
        <p>
          Vui lòng kiểm tra kỹ sản phẩm trước khi thanh toán. Mọi thắc mắc xin
          liên hệ hotline.
        </p>
      </footer>
    </div>
  );
};

export default OrderPrintClient;
