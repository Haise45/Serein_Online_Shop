"use client";

import { OrderSummary } from "@/types/order_model";
import OrderRow from "./OrderRow";

interface OrderListProps {
  orders: OrderSummary[];
  onMarkAsDelivered?: (orderId: string) => void;
  isMarkingDelivered: boolean;
  currentMarkingDeliveredId: string | null;
  openRequestModal: (orderId: string, type: "cancellation" | "refund") => void;
}

const OrderList: React.FC<OrderListProps> = ({
  orders,
  onMarkAsDelivered,
  isMarkingDelivered,
  currentMarkingDeliveredId,
  openRequestModal,
}) => {
  return (
    <ul role="list" className="space-y-6">
      {orders.map((order) => (
        <OrderRow
          key={order._id.toString()}
          order={order}
          onMarkAsDelivered={onMarkAsDelivered}
          isMarkingDelivered={isMarkingDelivered}
          currentMarkingDeliveredId={currentMarkingDeliveredId}
          openRequestModal={openRequestModal}
        />
      ))}
    </ul>
  );
};

export default OrderList;