"use client";

import { Order, User } from "@/types";
import { cilContact, cilLocationPin } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import Link from "next/link";

interface OrderCustomerInfoProps {
  order: Order;
}

// Type guard để kiểm tra xem user có phải là User object hay không
const isUserObject = (user: User | string | null | undefined): user is User => {
  return (
    user !== null &&
    user !== undefined &&
    typeof user === "object" &&
    "_id" in user
  );
};

const OrderCustomerInfo: React.FC<OrderCustomerInfoProps> = ({ order }) => {
  const customerName = isUserObject(order.user)
    ? order.user.name
    : order.shippingAddress.fullName;

  const customerEmail = isUserObject(order.user)
    ? order.user.email
    : order.guestOrderEmail;

  const customerPhone = order.shippingAddress.phone;

  const { street, communeName, districtName, provinceName } =
    order.shippingAddress;
  const fullAddress = [street, communeName, districtName, provinceName]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Customer Info */}
      <div>
        <h3 className="mb-3 flex items-center text-lg font-semibold text-gray-800">
          <CIcon icon={cilContact} className="mr-2 h-5 w-5" />
          Thông tin khách hàng
        </h3>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Tên:</strong> {customerName}
          </p>
          <p>
            <strong>Email:</strong> {customerEmail}
          </p>
          <p>
            <strong>Điện thoại:</strong> {customerPhone}
          </p>
          {isUserObject(order.user) && (
            <p>
              <strong>Loại:</strong>{" "}
              <Link
                href={`/admin/users/${order.user._id}`}
                className="text-indigo-600 hover:underline text-decoration-none"
              >
                Thành viên
              </Link>
            </p>
          )}
          {!order.user && (
            <p>
              <strong>Loại:</strong>{" "}
              <span className="text-gray-600">Khách vãng lai</span>
            </p>
          )}
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="mb-3 flex items-center text-lg font-semibold text-gray-800">
          <CIcon icon={cilLocationPin} className="mr-2 h-5 w-5" />
          Địa chỉ giao hàng
        </h3>
        <div className="space-y-1 text-sm text-gray-700">
          <p className="font-medium">
            {order.shippingAddress.fullName} - {order.shippingAddress.phone}
          </p>
          <p>{fullAddress}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderCustomerInfo;
