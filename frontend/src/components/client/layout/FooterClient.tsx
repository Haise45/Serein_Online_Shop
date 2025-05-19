"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";

// Giữ nguyên các hằng số và biến môi trường của bạn
const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME || "Serein Shop";
const SHOP_ADDRESS =
  process.env.NEXT_PUBLIC_SHOP_ADDRESS ||
  "123 Đường ABC, Phường X, Quận Y, TP.HCM";
const SHOP_PHONE = process.env.NEXT_PUBLIC_SHOP_PHONE || "0909.123.456";
const SHOP_EMAIL = process.env.NEXT_PUBLIC_SHOP_EMAIL || "hotro@serein.com";

const SOCIAL_LINKS = {
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "#",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "#",
  //   tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "#",
  x: process.env.NEXT_PUBLIC_X_URL || "#",
};

interface FooterLink {
  href: string;
  label: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerLinkSections: FooterSection[] = [
  {
    title: "Hỗ Trợ Khách Hàng",
    links: [
      { href: "/help-center", label: "Trung Tâm Trợ Giúp" },
      { href: "/how-to-buy", label: "Hướng Dẫn Mua Hàng" },
      { href: "/payment-methods", label: "Phương Thức Thanh Toán" },
      { href: "/shipping-policy", label: "Chính Sách Vận Chuyển" },
      { href: "/faqs", label: "Câu Hỏi Thường Gặp" },
    ],
  },
  {
    title: "Chính Sách",
    links: [
      { href: "/return-policy", label: "Chính Sách Đổi Trả" },
      { href: "/warranty-policy", label: "Chính Sách Bảo Hành" },
      { href: "/privacy-policy", label: "Chính Sách Bảo Mật" },
      { href: "/terms-of-service", label: "Điều Khoản Dịch Vụ" },
    ],
  },
];

// Danh sách các link cho cột "Về Chúng Tôi"
const aboutUsLinks: FooterLink[] = [
  { href: "/about-us", label: "Giới Thiệu" },
  { href: "/careers", label: "Tuyển Dụng" },
  { href: "/store-locations", label: "Hệ Thống Cửa Hàng" },
  { href: "/contact-us", label: "Liên Hệ" },
];

export default function FooterClient() {
  const [newsletterEmail, setNewsletterEmail] = useState<string>("");
  const [newsletterMessage, setNewsletterMessage] = useState<string>("");
  const [newsletterLoading, setNewsletterLoading] = useState<boolean>(false);

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    setNewsletterMessage("");
    console.log("Đăng ký nhận tin với email:", newsletterEmail);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setNewsletterMessage(
      `Cảm ơn bạn đã đăng ký! Chúng tôi sẽ gửi thông tin đến ${newsletterEmail}.`,
    );
    setNewsletterEmail("");
    setNewsletterLoading(false);
  };

  return (
    <footer className="bg-gray-900 pt-16 pb-10 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Phần trên của Footer: Logo, Links, Newsletter */}
        <div className="mb-10 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Cột 1 & 2: Logo và Thông tin liên hệ (chiếm 4/12 cột trên LG) */}
          <div className="md:col-span-1 lg:col-span-3">
            <Link href="/" className="mb-6 inline-block">
              {/* Logo của bạn (có thể là ảnh hoặc text) */}
              <span className="text-4xl font-bold text-white italic">
                SEREIN
              </span>
            </Link>
            <address className="space-y-3 text-sm text-gray-400 not-italic">
              <div className="flex items-start">
                <FiMapPin className="mt-1 mr-3 h-4 w-4 flex-shrink-0 text-gray-500" />
                <span>{SHOP_ADDRESS}</span>
              </div>
              <div className="flex items-center">
                <FiPhone className="mr-3 h-4 w-4 flex-shrink-0 text-gray-500" />
                <a
                  href={`tel:${SHOP_PHONE.replace(/\./g, "")}`}
                  className="transition-colors duration-200 hover:text-white"
                >
                  {SHOP_PHONE}
                </a>
              </div>
              <div className="flex items-center">
                <FiMail className="mr-3 h-4 w-4 flex-shrink-0 text-gray-500" />
                <a
                  href={`mailto:${SHOP_EMAIL}`}
                  className="transition-colors duration-200 hover:text-white"
                >
                  {SHOP_EMAIL}
                </a>
              </div>
            </address>
          </div>

          {/* Cột 3 & 4: Các mục link (mỗi mục chiếm 2/12 cột trên LG) */}
          {footerLinkSections.map((section) => (
            <div key={section.title} className="md:col-span-1 lg:col-span-2">
              <h3 className="mb-5 text-sm font-semibold tracking-wider text-gray-200 uppercase">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Cột 5: Về chúng tôi (chiếm 2/12 cột trên LG) */}
          <div className="md:col-span-1 lg:col-span-2">
            <h3 className="mb-5 text-sm font-semibold tracking-wider text-gray-200 uppercase">
              Về {SHOP_NAME}
            </h3>
            <ul className="space-y-3">
              {aboutUsLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 6: Đăng ký nhận tin (chiếm 2/12 cột trên LG) */}
          <div className="md:col-span-2 lg:col-span-3">
            <div>
              <h3 className="mb-5 text-sm font-semibold tracking-wider text-gray-200 uppercase">
                Đăng Ký Nhận Tin
              </h3>
              <p className="mb-4 text-sm text-gray-400">
                Nhận thông tin sản phẩm mới và khuyến mãi đặc biệt.
              </p>
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col gap-2 sm:flex-row sm:items-start"
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Địa chỉ email
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  name="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full flex-grow appearance-none rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Email của bạn"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className={`flex-shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none ${newsletterLoading ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {newsletterLoading ? "Đang..." : "Gửi"}
                </button>
              </form>
              {newsletterMessage && (
                <p className="mt-2 text-xs text-green-400">
                  {newsletterMessage}
                </p>
              )}
            </div>

            {/* Social Media Icons */}
            <div className="mt-8">
              <div className="flex space-x-4">
                {SOCIAL_LINKS.facebook && SOCIAL_LINKS.facebook !== "#" && (
                  <Link
                    href={SOCIAL_LINKS.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-all duration-300 ease-in-out hover:bg-gray-700 hover:text-white"
                    aria-label="Facebook"
                  >
                    <FaFacebookF className="h-5 w-5 transform transition-transform duration-300 ease-in-out group-hover:scale-110" />
                  </Link>
                )}
                {SOCIAL_LINKS.instagram && SOCIAL_LINKS.instagram !== "#" && (
                  <Link
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-all duration-300 ease-in-out hover:bg-gray-700 hover:text-white"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="h-5 w-5 transform transition-transform duration-300 ease-in-out group-hover:scale-110" />
                  </Link>
                )}
                {SOCIAL_LINKS.youtube && SOCIAL_LINKS.youtube !== "#" && (
                  <Link
                    href={SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-all duration-300 ease-in-out hover:bg-gray-700 hover:text-white"
                    aria-label="YouTube"
                  >
                    <FaYoutube className="h-5 w-5 transform transition-transform duration-300 ease-in-out group-hover:scale-110" />
                  </Link>
                )}
                {SOCIAL_LINKS.x && SOCIAL_LINKS.x !== "#" && (
                  <Link
                    href={SOCIAL_LINKS.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-all duration-300 ease-in-out hover:bg-gray-700 hover:text-white"
                    aria-label="X (Twitter)"
                  >
                    <FaXTwitter className="h-5 w-5 transform transition-transform duration-300 ease-in-out group-hover:scale-110" />
                  </Link>
                )}
                {/* {SOCIAL_LINKS.tiktok && SOCIAL_LINKS.tiktok !== "#" && (
                <Link
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-all duration-300 ease-in-out hover:bg-gray-700 hover:text-white"
                  aria-label="TikTok"
                >
                  <FaTiktok className="h-5 w-5 transform transition-transform duration-300 ease-in-out group-hover:scale-110" />
                </Link>
              )} */}
              </div>
            </div>
          </div>
        </div>

        {/* Đường kẻ ngang và phần Copyright/Social */}
        <div className="mt-10 border-t border-gray-700 pt-8">
          <div className="flex flex-col items-center justify-between gap-y-6 md:flex-row">
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {SHOP_NAME}. Mọi quyền được bảo lưu.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
