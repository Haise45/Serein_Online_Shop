"use client";
import "@/app/globals.css";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";

import { useSettings } from "@/app/SettingsContext";
import { getLocalizedName } from "@/lib/utils";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  A11y,
  Autoplay,
  EffectFade,
  Navigation,
  Pagination,
} from "swiper/modules";

export default function HeroBanner() {
  const settingsContext = useSettings();
  const locale = useLocale() as "vi" | "en";

  const { settings, isLoading } = settingsContext;

  // Lọc ra các banner đã được kích hoạt
  const activeBanners =
    settings?.landingPage?.banners?.filter((b) => b.isActive) || [];

  // --- Xử lý trạng thái Loading ---
  if (isLoading) {
    // Hiển thị một placeholder với hiệu ứng pulse trong khi chờ dữ liệu
    return (
      <div className="group relative aspect-[16/7] w-full animate-pulse bg-gray-200"></div>
    );
  }

  // --- Xử lý khi không có banner ---
  if (activeBanners.length === 0) {
    // Không render gì cả nếu không có banner nào được kích hoạt
    return null;
  }

  return (
    <div className="group relative aspect-[16/7] w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade, A11y]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: ".swiper-button-next-custom",
          prevEl: ".swiper-button-prev-custom",
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
          renderBullet: function (index, className) {
            // Custom render để dễ dàng style hơn
            return `<span class="${className} w-3 h-3 bg-white/70 backdrop-blur-sm md:w-4 md:h-4"></span>`;
          },
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={true}
        className="h-full w-full"
        // Thêm class cho swiper-wrapper nếu cần style sâu hơn
        // wrapperClass="my-custom-wrapper"
        a11y={{
          prevSlideMessage: "Previous Slide",
          nextSlideMessage: "Next Slide",
          paginationBulletMessage: "Go to slide {{index}}",
        }}
      >
        {activeBanners.map((slide, index) => {
          const title = getLocalizedName(slide.title, locale);
          const subtitle = getLocalizedName(slide.subtitle, locale);
          const buttonText = getLocalizedName(slide.buttonText, locale);
          const altText = title || "Banner image";

          return (
            // Thêm class `group` vào SwiperSlide
            <SwiperSlide key={slide._id || index} className="group relative">
              <div className="relative h-full w-full">
                <Image
                  src={slide.imageUrl}
                  alt={altText || `Slide ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                  priority={index === 0}
                  quality={100}
                  className="transition-all duration-500 group-hover:brightness-50"
                />
              </div>

              {/* Container cho text và button */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:p-8">
                <h1 className="mb-2 translate-y-4 text-2xl font-bold drop-shadow-lg transition-transform duration-500 ease-out group-hover:translate-y-0 sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
                  {title}
                </h1>
                <p className="mb-4 max-w-lg translate-y-4 text-sm drop-shadow-md transition-transform delay-100 duration-500 ease-out group-hover:translate-y-0 sm:mb-6 sm:text-base md:text-lg lg:text-xl">
                  {subtitle}
                </p>
                <Link
                  href={slide.buttonLink}
                  className="translate-y-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all delay-200 duration-500 ease-out group-hover:translate-y-0 hover:bg-indigo-700 sm:px-6 sm:py-3 sm:text-base"
                >
                  {buttonText}
                </Link>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      {/* Custom Navigation Buttons */}
      <div className="swiper-button-prev-custom absolute top-1/2 left-2 z-10 -translate-y-1/2 transform cursor-pointer bg-white/20 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/40 sm:left-4">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 12H4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 6L4 12L10 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="swiper-button-next-custom absolute top-1/2 right-2 z-10 -translate-y-1/2 transform cursor-pointer bg-white/20 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/40 sm:right-4">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 6L20 12L14 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
