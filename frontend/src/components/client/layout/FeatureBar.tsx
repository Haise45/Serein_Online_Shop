"use client";
import { useTranslations } from "next-intl";
import React from "react";
import { FiPhoneCall, FiRepeat, FiShield, FiTruck } from "react-icons/fi";

interface FeatureConfig {
  key: "delivery" | "returns" | "genuine" | "support";
  icon: React.ElementType;
  iconColorClass?: string;
  hoverColorClass?: string;
}

const featuresConfig: FeatureConfig[] = [
  {
    key: "delivery",
    icon: FiTruck,
    iconColorClass: "bg-emerald-500 text-emerald-50",
    hoverColorClass: "group-hover:bg-emerald-600",
  },
  {
    key: "returns",
    icon: FiRepeat,
    iconColorClass: "bg-sky-500 text-sky-50",
    hoverColorClass: "group-hover:bg-sky-600",
  },
  {
    key: "genuine",
    icon: FiShield,
    iconColorClass: "bg-rose-500 text-rose-50",
    hoverColorClass: "group-hover:bg-rose-600",
  },
  {
    key: "support",
    icon: FiPhoneCall,
    iconColorClass: "bg-amber-500 text-amber-50",
    hoverColorClass: "group-hover:bg-amber-600",
  },
];

export default function FeatureBar() {
  const t = useTranslations("FeatureBar");

  return (
    <section className="bg-gray-100 py-12 sm:py-16">
      {/* Nền trắng cho section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {t("title", {
              shopName: process.env.NEXT_PUBLIC_SHOP_NAME || "Serein",
            })}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:mt-4 sm:text-base">
            {t("subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {featuresConfig.map((feature) => (
            <div
              key={feature.key}
              // Thêm 'group' để có thể style con khi cha hover
              className="group flex flex-col items-center rounded-xl bg-white py-10 text-center shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-300 ease-in-out ${feature.iconColorClass || "bg-indigo-500 text-white"} ${feature.hoverColorClass || "group-hover:bg-indigo-600"}`}
              >
                <feature.icon className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="text-md mb-1 font-semibold text-gray-900 sm:text-lg">
                {t(`features.${feature.key}.title`)}
              </h3>
              <p className="text-xs text-gray-500 sm:text-sm">
                {t(`features.${feature.key}.subtitle`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
