"use client";

import { useGetAttributes } from "@/lib/react-query/attributeQueries";
import { AppDispatch, RootState } from "@/store";
import { removePopup } from "@/store/slices/notificationPopupSlice";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddedToCartPopup from "./AddedToCartPopup";

export default function AddedToCartPopupManager() {
  const dispatch: AppDispatch = useDispatch();
  const { popups } = useSelector((state: RootState) => state.notificationPopup);

  const { data: attributes } = useGetAttributes();
  
  const attributeMap = useMemo(() => {
    if (!attributes) return new Map();
    const map = new Map<
      string,
      { label: string; values: Map<string, string> }
    >();
    attributes.forEach((attr) => {
      const valueMap = new Map<string, string>();
      attr.values.forEach((val) => valueMap.set(val._id, val.value));
      map.set(attr._id, { label: attr.label, values: valueMap });
    });
    return map;
  }, [attributes]);

  if (!popups || popups.length === 0) {
    return null;
  }


  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col items-end space-y-3">
      {/* Render các popup, popup mới nhất (đầu mảng) sẽ ở trên */}
      {popups.map((popupItem) => (
        <AddedToCartPopup
          key={popupItem.id}
          item={popupItem} // Truyền toàn bộ PopupNotificationItem
          onClose={() => dispatch(removePopup(popupItem.id))}
          attributeMap={attributeMap}
        />
      ))}
    </div>
  );
}
