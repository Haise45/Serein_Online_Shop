import { AdminDynamicData } from "@/utils/adminBreadcrumbs";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BreadcrumbState {
  dynamicData: AdminDynamicData;
}

const initialState: BreadcrumbState = {
  dynamicData: {},
};

const breadcrumbSlice = createSlice({
  name: "breadcrumb",
  initialState,
  reducers: {
    // Action để set hoặc cập nhật dữ liệu động
    setBreadcrumbDynamicData: (
      state,
      action: PayloadAction<AdminDynamicData>,
    ) => {
      state.dynamicData = { ...state.dynamicData, ...action.payload };
    },
    // Action để xóa dữ liệu động khi không cần nữa
    clearBreadcrumbDynamicData: (state) => {
      state.dynamicData = {};
    },
  },
});

export const { setBreadcrumbDynamicData, clearBreadcrumbDynamicData } =
  breadcrumbSlice.actions;

export default breadcrumbSlice.reducer;
