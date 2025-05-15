"use client";
import React from "react";
import { FiPhoneCall, FiRepeat, FiShield, FiTruck } from "react-icons/fi";

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconColorClass?: string; // Màu cho icon và nền icon (ví dụ: bg-blue-500 text-blue-100)
  hoverColorClass?: string; // Màu khi hover (ví dụ: group-hover:bg-blue-600)
}

const features: FeatureItem[] = [
  {
    icon: FiTruck,
    title: "Giao Hàng Toàn Quốc",
    subtitle: "Miễn phí vận chuyển cho đơn từ 500K",
    iconColorClass: "bg-emerald-500 text-emerald-50",
    hoverColorClass: "group-hover:bg-emerald-600",
  },
  {
    icon: FiRepeat,
    title: "Đổi Trả Linh Hoạt",
    subtitle: "Trong vòng 7 ngày, thủ tục đơn giản",
    iconColorClass: "bg-sky-500 text-sky-50",
    hoverColorClass: "group-hover:bg-sky-600",
  },
  {
    icon: FiShield,
    title: "Hàng Chính Hãng 100%",
    subtitle: "Cam kết chất lượng và nguồn gốc",
    iconColorClass: "bg-rose-500 text-rose-50",
    hoverColorClass: "group-hover:bg-rose-600",
  },
  {
    icon: FiPhoneCall,
    title: "Hỗ Trợ Khách Hàng",
    subtitle: "Hotline 24/7: 1900.1234",
    iconColorClass: "bg-amber-500 text-amber-50",
    hoverColorClass: "group-hover:bg-amber-600",
  },
  // Bạn có thể thêm màu sắc riêng cho từng feature
  // {
  //   icon: FiCreditCard,
  //   title: 'Thanh Toán An Toàn',
  //   subtitle: 'Bảo mật, đa dạng lựa chọn',
  //   iconColorClass: "bg-purple-500 text-purple-50",
  //   hoverColorClass: "group-hover:bg-purple-600",
  // },
  // {
  //   icon: FiPackage,
  //   title: 'Đóng Gói Chuyên Nghiệp',
  //   subtitle: 'Sản phẩm đến tay nguyên vẹn',
  //   iconColorClass: "bg-slate-500 text-slate-50",
  //   hoverColorClass: "group-hover:bg-slate-600",
  // },
];

export default function FeatureBar() {
  return (
    <section className="bg-gray-100 py-12 sm:py-16">
      {" "}
      {/* Nền trắng cho section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Tại Sao Chọn {process.env.NEXT_PUBLIC_SHOP_NAME || "Serein"}?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:mt-4 sm:text-base">
            Chúng tôi cam kết mang đến trải nghiệm mua sắm tốt nhất cho bạn.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              // Thêm 'group' để có thể style con khi cha hover
              className="group flex flex-col items-center rounded-xl bg-white py-10 text-center shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300 ease-in-out ${feature.iconColorClass || "bg-indigo-500 text-white"} ${feature.hoverColorClass || "group-hover:bg-indigo-600"}`}
              >
                <feature.icon className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="text-md mb-1 font-semibold text-gray-900 sm:text-lg">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-500 sm:text-sm">
                {feature.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
