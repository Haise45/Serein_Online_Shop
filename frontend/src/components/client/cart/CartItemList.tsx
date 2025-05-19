"use client";
import { CartItem as CartItemType } from "@/types/cart";
import CartItemRow from "./CartItemRow";

interface CartItemListProps {
  items: CartItemType[];
  selectedItemIds: Set<string>;
  onSelectItem: (itemId: string, isSelected: boolean) => void;
}

export default function CartItemList({
  items,
  selectedItemIds,
  onSelectItem,
}: CartItemListProps) {
  return (
    <ul
      role="list"
      className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm"
    >
      {items.map((item) => (
        <CartItemRow
          key={item._id}
          item={item}
          isSelected={selectedItemIds.has(item._id)} // Truyền trạng thái selected
          onSelectItem={onSelectItem} // Truyền hàm callback
        />
      ))}
    </ul>
  );
}
