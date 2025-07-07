"use client";

import OrderPrintClient from "./OrderPrintClient";
import { useParams } from "next/navigation";
import React from "react";
import "./print.css";

// Trang này giờ là Client Component, không fetch dữ liệu trên server nữa.
export default function OrderPrintPage() {
  const params = useParams();
  const orderId = params.id as string; // Lấy ID từ hook useParams

  if (!orderId) {
    // Xử lý trường hợp không có ID (dù khó xảy ra)
    return <div>Đang tải hoặc ID đơn hàng không hợp lệ...</div>;
  }

  return <OrderPrintClient orderId={orderId} />;
}