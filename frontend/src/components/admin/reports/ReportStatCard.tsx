"use client";

import { CSpinner } from "@coreui/react";

interface ReportStatCardProps {
  title: string;
  value: string | number;
  isLoading: boolean;
  description?: string;
}

const ReportStatCard: React.FC<ReportStatCardProps> = ({
  title,
  value,
  isLoading,
  description,
}) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-1 text-2xl font-bold text-gray-800">
        {isLoading ? <CSpinner size="sm" /> : value}
      </div>
      {description && (
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      )}
    </div>
  );
};

export default ReportStatCard;
