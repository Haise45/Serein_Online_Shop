"use client";

import Image from "next/image";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useEffect, useRef, useCallback } from "react";
import classNames from "classnames";
import { useTranslations } from "next-intl";

interface ReviewImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  startIndex?: number;
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  userNameForAlt: string;
}

const ReviewImageLightbox: React.FC<ReviewImageLightboxProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
  userNameForAlt,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("ReviewLightbox");

  const handlePrevImage = useCallback(() => {
    if (images.length > 0) {
      onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
    }
  }, [images, currentIndex, onNavigate]);

  const handleNextImage = useCallback(() => {
    if (images.length > 0) {
      onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
    }
  }, [images, currentIndex, onNavigate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    },
    [isOpen, onClose, handlePrevImage, handleNextImage],
  );

  useEffect(() => {
    const currentModalRef = modalRef.current;
    if (isOpen && currentModalRef) {
      currentModalRef.focus();
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]); // Chỉ handleKeyDown vì các hàm bên trong nó đã có dependencies đúng

  if (!isOpen || !images || images.length === 0) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      tabIndex={-1} // Cho phép focus để bắt keydown
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
    >
      {/* Nút Đóng */}
      <button
        className="absolute top-3 right-3 z-20 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white focus:outline-none sm:top-4 sm:right-4"
        onClick={onClose}
        aria-label={t("close")}
      >
        <FiX className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      {/* Container Ảnh chính và Nút điều hướng */}
      <div
        className="relative flex h-full w-full max-w-5xl items-center justify-center" // Chừa không gian cho thumbnails
        onClick={(e) => e.stopPropagation()} // Ngăn đóng modal khi click vào ảnh
      >
        {images.length > 1 && (
          <>
            <button
              className="absolute top-1/2 left-1 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white focus:outline-none sm:-left-30 sm:p-3"
              onClick={handlePrevImage}
              aria-label={t("prevImage")}
            >
              <FiChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
            <button
              className="absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white focus:outline-none sm:-right-30 sm:p-3"
              onClick={handleNextImage}
              aria-label={t("nextImage")}
            >
              <FiChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </>
        )}
        {/* Ảnh chính */}
        <div className="relative h-full w-full">
          <Image
            src={images[currentIndex]}
            alt={t("mainImageAlt", { user: userNameForAlt, index: currentIndex + 1 })}
            fill
            className="object-contain"
            sizes="90vw"
            quality={100}
            priority
          />
        </div>
      </div>

      {/* Counter và Thumbnails */}
      <div
        className="absolute right-0 bottom-2 left-0 z-10 flex flex-col items-center sm:bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <div className="mb-2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white sm:mb-3">
            {t("imageCounter", { current: currentIndex + 1, total: images.length })}
          </div>
        )}
        {images.length > 1 && (
          <div className="scrollbar-thin scrollbar-thumb-gray-400/50 scrollbar-track-transparent flex max-w-[90vw] gap-x-2 overflow-x-auto rounded-lg p-1.5 backdrop-blur-sm sm:max-w-xl sm:gap-x-2.5 sm:p-2">
            {images.map((imgUrl, idx) => (
              <button
                key={idx}
                className={classNames(
                  "relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all duration-150 focus:outline-none sm:h-16 sm:w-16",
                  idx === currentIndex
                    ? "border-indigo-400 ring-1 ring-indigo-400"
                    : "border-transparent opacity-60 hover:opacity-90 focus:border-white/50 focus:opacity-90",
                )}
                onClick={() => onNavigate(idx)}
                aria-label={t("viewThumbnail", { index: idx + 1 })}
              >
                <Image
                  src={imgUrl}
                  alt={t("thumbnailAlt", { index: idx + 1 })}
                  fill
                  className="object-cover"
                  quality={100}
                  sizes="64px" // Kích thước của thumbnail
                />
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Để screen reader đọc được tiêu đề modal */}
      <h2 id="lightbox-title" className="sr-only">
        {t("title")}
      </h2>
    </div>
  );
};

export default ReviewImageLightbox;
