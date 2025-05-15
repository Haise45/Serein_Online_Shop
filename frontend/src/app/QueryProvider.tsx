"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React, { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sử dụng useState để đảm bảo queryClient chỉ được tạo một lần phía client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Dữ liệu được coi là cũ sau 1 phút
            refetchOnWindowFocus: false, // Tắt refetch khi focus lại cửa sổ (tùy chọn)
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />{" "}
      {/* Hiển thị devtools, tắt ở production */}
    </QueryClientProvider>
  );
}
