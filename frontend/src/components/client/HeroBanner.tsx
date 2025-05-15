"use client";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "@/app/globals.css"
import { Swiper, SwiperSlide } from "swiper/react";

import Image from "next/image";
import Link from "next/link";
import {
  A11y,
  Autoplay,
  EffectFade,
  Navigation,
  Pagination,
} from "swiper/modules";

const bannerSlides = [
  {
    id: 1,
    imageUrl: "/images/banners/banner-1.jpg",
    altText: "Bộ sưu tập mới mùa hè",
    title: "Bộ Sưu Tập Hè 2025",
    subtitle: "Khám phá phong cách nổi bật cho mùa hè năng động.",
    buttonText: "Xem Ngay",
    buttonLink: "/products?collection=summer-2025",
  },
  {
    id: 2,
    imageUrl: "/images/banners/banner-2.jpg",
    altText: "Giảm giá đặc biệt",
    title: "Ưu Đãi Lớn Tháng Này",
    subtitle: "Giảm giá đến 50% cho hàng ngàn sản phẩm.",
    buttonText: "Săn Sale",
    buttonLink: "/sale-off",
  },
  {
    id: 3,
    imageUrl: "/images/banners/banner-3.jpg",
    altText: "Thời trang công sở",
    title: "Thanh Lịch Chốn Công Sở",
    subtitle: "Những thiết kế tinh tế cho ngày làm việc hiệu quả.",
    buttonText: "Tìm Hiểu Thêm",
    buttonLink: "/products?category=cong-so",
  },
];

export default function HeroBanner() {
  return (
    <div className="group relative h-[300px] w-full sm:h-[400px] md:h-[500px] lg:h-[600px]">
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
            return `<span class="${className} w-3 h-3 md:w-4 md:h-4"></span>`;
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
          prevSlideMessage: "Slide trước",
          nextSlideMessage: "Slide tiếp theo",
          paginationBulletMessage: "Đi đến slide {{index}}",
        }}
      >
        {bannerSlides.map((slide) => (
          // Thêm class `group` vào SwiperSlide
          <SwiperSlide key={slide.id} className="group relative">
            <Image
              src={slide.imageUrl}
              alt={slide.altText}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1200px"
              style={{ objectFit: "cover" }}
              priority={slide.id === 1}
              className="transition-all duration-500 group-hover:brightness-70"
            />
            {/* Container cho text và button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:p-8">
              <h1 className="mb-2 translate-y-4 text-2xl font-bold drop-shadow-lg transition-transform duration-500 ease-out group-hover:translate-y-0 sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
                {slide.title}
              </h1>
              <p className="mb-4 max-w-lg translate-y-4 text-sm drop-shadow-md transition-transform delay-100 duration-500 ease-out group-hover:translate-y-0 sm:mb-6 sm:text-base md:text-lg lg:text-xl">
                {slide.subtitle}
              </p>
              <Link
                href={slide.buttonLink}
                className="translate-y-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all delay-200 duration-500 ease-out group-hover:translate-y-0 hover:bg-indigo-700 sm:px-6 sm:py-3 sm:text-base"
              >
                {slide.buttonText}
              </Link>
            </div>
          </SwiperSlide>
        ))}
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
