"use client";

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { removePopup } from '@/store/slices/notificationPopupSlice';
import AddedToCartPopup from './AddedToCartPopup';

export default function AddedToCartPopupManager() {
  const dispatch: AppDispatch = useDispatch();
  const { popups } = useSelector((state: RootState) => state.notificationPopup);

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
        />
      ))}
    </div>
  );
}