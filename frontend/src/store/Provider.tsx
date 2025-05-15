"use client";

import { Provider } from "react-redux";
import { store } from "./index"; // Import store đã tạo

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
