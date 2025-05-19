import { CartItem } from '@/types/cart';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PopupNotificationItem extends CartItem {
  id: string; // ID duy nhất cho mỗi popup
  addedAt: number; // Thời gian thêm vào để sắp xếp hoặc loại bỏ
}

interface NotificationPopupState {
  popups: PopupNotificationItem[];
  maxPopups: number;
}

const initialState: NotificationPopupState = {
  popups: [],
  maxPopups: 2, // Số lượng popup tối đa hiển thị cùng lúc
};

const notificationPopupSlice = createSlice({
  name: 'notificationPopup',
  initialState,
  reducers: {
    addPopup: (state, action: PayloadAction<CartItem>) => {
      const newItem: PopupNotificationItem = {
        ...action.payload,
        id: `popup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Tạo ID duy nhất
        addedAt: Date.now(),
      };

      state.popups.unshift(newItem); // Thêm vào đầu mảng (popup mới nhất ở trên)

      // Nếu vượt quá số lượng tối đa, loại bỏ popup cũ nhất
      if (state.popups.length > state.maxPopups) {

        // Vì unshift đã thêm vào đầu, chỉ cần pop cái cuối cùng nếu vượt quá
         state.popups.pop();
      }
    },
    removePopup: (state, action: PayloadAction<string>) => { // action.payload là ID của popup cần xóa
      state.popups = state.popups.filter(popup => popup.id !== action.payload);
    },
  },
});

export const { addPopup, removePopup } = notificationPopupSlice.actions;
export default notificationPopupSlice.reducer;