import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Cập nhật giá trị debounced sau một khoảng delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy timeout nếu value thay đổi (ví dụ: người dùng tiếp tục gõ)
    // hoặc nếu delay thay đổi, hoặc nếu component unmount.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Chỉ re-call effect nếu value hoặc delay thay đổi

  return debouncedValue;
}

export default useDebounce;