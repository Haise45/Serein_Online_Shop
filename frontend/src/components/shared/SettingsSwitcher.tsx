"use client";

import { useSettings } from "@/app/SettingsContext";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import classNames from "classnames";
import { useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";
import ReactCountryFlag from "react-country-flag";
import { BsCurrencyDollar } from "react-icons/bs";
import { FaCheck } from "react-icons/fa6";
import { FiSettings } from "react-icons/fi";

// --- Icon Tùy chỉnh cho Tiền tệ ---
// Component này vẽ ký tự "₫" bên trong một SVG, cho phép style như một icon thật.
const DongSymbolIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <text
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontSize="20"
      fontWeight="bold"
    >
      ₫
    </text>
  </svg>
);

// --- Định nghĩa Ngôn ngữ ---
interface LanguageOption {
  code: "vi" | "en";
  countryCode: string;
}

const languageOptions: LanguageOption[] = [
  // Lưu ý: locale 'vi' tương ứng với mã nước 'VN'
  { code: "vi", countryCode: "VN" },
  // locale 'en' tương ứng với mã nước 'GB' (Great Britain) cho cờ Union Jack
  { code: "en", countryCode: "GB" },
];

// --- Định nghĩa Tiền tệ ---
interface CurrencyOption {
  code: "VND" | "USD";
  name: string;
  icon: React.ElementType;
}

const currencyOptions: CurrencyOption[] = [
  { code: "VND", name: "Vietnamese Dong", icon: DongSymbolIcon },
  { code: "USD", name: "US Dollar", icon: BsCurrencyDollar },
];

interface SettingsSwitcherProps {
  menuPlacement?: "top" | "bottom";
}

export default function SettingsSwitcher({
  menuPlacement = "bottom",
}: SettingsSwitcherProps) {
  // Hooks cho Ngôn ngữ và Tiền tệ
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as "vi" | "en";
  const settingsContext = useSettings();
  const t = useTranslations("SettingDropdown");

  // Trạng thái tải dữ liệu
  if (!settingsContext || settingsContext.isLoading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200"></div>
    );
  }

  const { displayCurrency, setDisplayCurrency } = settingsContext;

  const handleLanguageChange = (nextLocale: "vi" | "en") => {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="flex items-center justify-center rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none data-[focus]:ring-offset-2">
        <FiSettings className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems
          anchor={menuPlacement === "top" ? "top end" : "bottom end"}
          className={classNames(
            "ring-opacity-5 absolute right-0 z-50 w-72 origin-top-right rounded-xl bg-white p-2 shadow-xl ring-1 ring-gray-300 focus:outline-none",
            menuPlacement === "top" ? "mb-2" : "mt-2",
          )}
        >
          {/* Phần chọn Ngôn ngữ */}
          <div>
            <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400">
              {t("language")}
            </div>
            {languageOptions.map((option) => (
              <MenuItem key={option.code}>
                <button
                  onClick={() => handleLanguageChange(option.code)}
                  className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm text-gray-800 transition-colors data-[active]:bg-gray-100"
                >
                  <div className="flex items-center gap-x-3">
                    {/* Bước 2: Sử dụng component ReactCountryFlag */}
                    <ReactCountryFlag
                      countryCode={option.countryCode}
                      svg // Rất quan trọng: để render dưới dạng SVG
                      style={{
                        width: "1.5em", // 24px
                        height: "1em", // 16px
                        borderRadius: "2px",
                      }}
                      title={t(option.code)} // Tốt cho accessibility
                    />
                    <span>{t(option.code)}</span>
                  </div>
                  {locale === option.code && (
                    <FaCheck className="h-4 w-4 text-indigo-600" />
                  )}
                </button>
              </MenuItem>
            ))}
          </div>

          <hr className="my-2 border-gray-100" />

          {/* Phần chọn Tiền tệ */}
          <div>
            <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400">
              {t("currency")}
            </div>
            {currencyOptions.map((option) => (
              <MenuItem key={option.code}>
                <button
                  onClick={() => setDisplayCurrency(option.code)}
                  className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm text-gray-800 transition-colors data-[active]:bg-gray-100"
                >
                  <div className="flex items-center gap-x-3">
                    <option.icon
                      className={classNames(
                        "h-5 w-5",
                        displayCurrency === option.code
                          ? "text-indigo-600"
                          : "text-gray-400",
                      )}
                      aria-hidden="true"
                    />
                    <span>
                      {option.name}{" "}
                      <span className="text-gray-500">({option.code})</span>
                    </span>
                  </div>
                  {displayCurrency === option.code && (
                    <FaCheck className="h-4 w-4 text-indigo-600" />
                  )}
                </button>
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
