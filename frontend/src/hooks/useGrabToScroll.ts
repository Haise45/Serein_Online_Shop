import { useRef, useEffect, useCallback } from "react";

export function useGrabToScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    isDown.current = true;
    el.classList.add("grabbing");
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    isDown.current = false;
    el.classList.remove("grabbing");
  }, []);

  const handleMouseUp = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    isDown.current = false;
    el.classList.remove("grabbing");
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = ref.current;
    if (!el || !isDown.current) return;

    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 2; // Tăng *2 để kéo nhạy hơn
    el.scrollLeft = scrollLeft.current - walk;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      // Sử dụng event listeners của DOM để có thể kéo ra ngoài phần tử
      el.addEventListener("mousedown", handleMouseDown as EventListener);
      el.addEventListener("mouseleave", handleMouseLeave as EventListener);
      el.addEventListener("mouseup", handleMouseUp as EventListener);
      el.addEventListener("mousemove", handleMouseMove as EventListener);

      return () => {
        el.removeEventListener("mousedown", handleMouseDown as EventListener);
        el.removeEventListener("mouseleave", handleMouseLeave as EventListener);
        el.removeEventListener("mouseup", handleMouseUp as EventListener);
        el.removeEventListener("mousemove", handleMouseMove as EventListener);
      };
    }
  }, [handleMouseDown, handleMouseLeave, handleMouseUp, handleMouseMove]);

  return ref;
}
