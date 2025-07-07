"use client";

import classNames from "classnames";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiMaximize2,
  FiX,
} from "react-icons/fi";
import { useTranslations } from "next-intl";

interface ImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productName,
  className = "",
}) => {
  const t = useTranslations("ImageGallery");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({
    0: true, // Mặc định ảnh đầu tiên đang tải
  });

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  const handlePrevious = useCallback(() => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1,
    );
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1,
    );
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    },
    [handlePrevious, handleNext],
  );

  const handleImageLoad = useCallback((index: number) => {
    // Khi ảnh tải xong, đặt trạng thái loading thành false
    setImageLoading((prev) => ({ ...prev, [index]: false }));
  }, []);

  // UseEffect để bật trạng thái loading khi ảnh thay đổi
  useEffect(() => {
    // Nếu ảnh chưa từng được tải (hoặc chưa có trong state), bật loading
    if (imageLoading[selectedImageIndex] === undefined) {
      setImageLoading((prev) => ({ ...prev, [selectedImageIndex]: true }));
    }
  }, [selectedImageIndex, imageLoading]);

  if (!images || images.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-gray-100 ${className}`}
      >
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-300">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500">{t("noImages")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-col ${className}`}>
        {/* Main Image Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-xl">
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute top-1/2 left-3 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                aria-label={t("prevImage")}
              >
                <FiChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute top-1/2 right-3 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                aria-label={t("nextImage")}
              >
                <FiChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            aria-label={t("fullscreen")}
          >
            <FiMaximize2 className="h-5 w-5" />
          </button>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              {t("imageCounter", {
                current: selectedImageIndex + 1,
                total: images.length,
              })}
            </div>
          )}

          {/* Main Image */}
          <Image
            key={selectedImageIndex}
            src={images[selectedImageIndex]}
            alt={t("mainImageAlt", { name: productName })}
            fill
            priority={selectedImageIndex === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 70vw, 60vw"
            className="h-full w-full object-cover object-center transition-opacity duration-500"
            onLoad={() => handleImageLoad(selectedImageIndex)}
          />

          {/* Loading Overlay */}
          {imageLoading[selectedImageIndex] && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Thumbnails - Dưới main image */}
        {images.length > 1 && (
          <div className="mt-6 w-full">
            <div className="flex justify-start gap-3 overflow-x-auto px-2 py-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={classNames(
                    "group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:h-20 sm:w-20 lg:h-24 lg:w-24",
                    {
                      "scale-105 transform shadow-lg ring-2 ring-indigo-500":
                        selectedImageIndex === index,
                      "ring-1 ring-gray-200 hover:ring-gray-300":
                        selectedImageIndex !== index,
                    },
                  )}
                  aria-label={t("viewThumbnail", { index: index + 1 })}
                >
                  <Image
                    src={image}
                    alt={t("thumbnailAlt", {
                      name: productName,
                      index: index + 1,
                    })}
                    fill
                    sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 96px"
                    className="object-cover transition-all duration-300 group-hover:scale-105"
                    onLoad={() => handleImageLoad(index)}
                  />

                  {/* Loading Overlay */}
                  {imageLoading[index] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                  )}

                  {/* Active Indicator */}
                  {selectedImageIndex === index && (
                    <div className="absolute inset-0 rounded-xl bg-indigo-500/10" />
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 rounded-xl bg-black/0 transition-colors duration-200 group-hover:bg-black/5" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 focus:ring-2 focus:ring-white focus:outline-none"
            aria-label={t("close")}
          >
            <FiX className="h-6 w-6" />
          </button>

          {/* Navigation in Fullscreen */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute top-1/2 left-6 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 focus:ring-2 focus:ring-white focus:outline-none"
                aria-label={t("prevImage")}
              >
                <FiChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute top-1/2 right-6 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 focus:ring-2 focus:ring-white focus:outline-none"
                aria-label={t("nextImage")}
              >
                <FiChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Fullscreen Image */}
          <div
            className="relative h-full max-h-[90vh] w-full max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedImageIndex]}
              alt={t("fullscreenImageAlt", {
                name: productName,
                index: selectedImageIndex + 1,
              })}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Image Counter in Fullscreen */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/20 px-6 py-3 font-medium text-white backdrop-blur-sm">
              {t("imageCounter", {
                current: selectedImageIndex + 1,
                total: images.length,
              })}
            </div>
          )}

          {/* Thumbnail Strip in Fullscreen */}
          {images.length > 1 && (
            <div className="scrollbar-hide absolute bottom-20 left-1/2 flex max-w-[90vw] -translate-x-1/2 gap-3 overflow-x-auto p-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleThumbnailClick(index);
                  }}
                  className={classNames(
                    "h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200",
                    {
                      "opacity-100 shadow-lg ring-2 ring-indigo-400":
                        selectedImageIndex === index,
                      "opacity-60 ring-1 ring-white/30 hover:opacity-80":
                        selectedImageIndex !== index,
                    },
                  )}
                  aria-label={t("viewThumbnail", { index: index + 1 })}
                >
                  <Image
                    src={image}
                    alt={t("thumbnailAlt", {
                      name: productName,
                      index: index + 1,
                    })}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;
