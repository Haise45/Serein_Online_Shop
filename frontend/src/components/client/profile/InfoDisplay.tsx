import { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface InfoDisplayProps {
  label: string;
  value: string | undefined | null;
  icon?: ReactNode;
}

const InfoDisplay: React.FC<InfoDisplayProps> = ({ label, value, icon }) => {
  const t = useTranslations("UpdateInfoForm");
  
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="mt-0.5 flex items-center">
        {icon && <span className="mr-2 text-gray-400">{icon}</span>}
        <p className="text-base text-gray-800">{value || t("unupdated")}</p>
      </div>
    </div>
  );
}

export default InfoDisplay;
