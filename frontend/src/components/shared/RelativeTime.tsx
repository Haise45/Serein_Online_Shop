"use client";

import { useFormatter, useNow } from "next-intl";

interface RelativeTimeProps {
  date: string | Date;
}

/**
 * Component này sẽ tự động hiển thị thời gian tương đối (ví dụ: "1 week ago", "5 phút trước")
 * và cập nhật theo ngôn ngữ hiện tại.
 */
export default function RelativeTime({ date }: RelativeTimeProps) {
  // Cập nhật mỗi phút để tiết kiệm tài nguyên.
  const now = useNow({
    updateInterval: 1000 * 60,
  });

  // `useFormatter` cung cấp các hàm định dạng đã được cấu hình cho ngôn ngữ hiện tại.
  const formatter = useFormatter();

  // `formatRelativeTime` sẽ tự động tính toán và dịch chuỗi.
  return <>{formatter.relativeTime(new Date(date), now)}</>;
}
