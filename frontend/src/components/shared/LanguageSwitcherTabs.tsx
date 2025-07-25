"use client";

import { CNav, CNavItem, CNavLink } from "@coreui/react";
import { useTranslations } from "next-intl";
import ReactCountryFlag from "react-country-flag";

interface LanguageSwitcherTabsProps {
  activeLocale: "vi" | "en";
  onLocaleChange: (locale: "vi" | "en") => void;
}

const LanguageSwitcherTabs: React.FC<LanguageSwitcherTabsProps> = ({
  activeLocale,
  onLocaleChange,
}) => {
  const t = useTranslations("Admin.languageSwitcher");

  return (
    <CNav variant="tabs" role="tablist" className="mb-4">
      <CNavItem role="presentation">
        <CNavLink
          active={activeLocale === "vi"}
          onClick={() => onLocaleChange("vi")}
          href="#"
          role="tab"
          aria-controls="vietnamese-panel"
          aria-selected={activeLocale === "vi"}
          className="d-flex align-items-center"
        >
          <ReactCountryFlag
            countryCode="VN"
            svg
            style={{
              width: "1.25em",
              height: "1.25em",
              marginRight: "0.5rem", // Tạo khoảng cách với text
              borderRadius: "2px", // Bo góc nhẹ cho đẹp
            }}
            title={t("vietnamese")} // Tốt cho accessibility
          />
          {t("vietnamese")}
        </CNavLink>
      </CNavItem>
      <CNavItem role="presentation">
        <CNavLink
          active={activeLocale === "en"}
          onClick={() => onLocaleChange("en")}
          href="#"
          role="tab"
          aria-controls="english-panel"
          aria-selected={activeLocale === "en"}
          className="d-flex align-items-center"
        >
          <ReactCountryFlag
            countryCode="GB" // Dùng GB (Great Britain) cho cờ Union Jack
            svg
            style={{
              width: "1.25em",
              height: "1.25em",
              marginRight: "0.5rem",
              borderRadius: "2px",
            }}
            title={t("english")}
          />
          {t("english")}
        </CNavLink>
      </CNavItem>
    </CNav>
  );
};

export default LanguageSwitcherTabs;
