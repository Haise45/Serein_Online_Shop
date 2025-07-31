"use client";

import { cilChart, cilList } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { CButton, CButtonGroup } from "@coreui/react";
import React, { useState } from "react";
import { useTranslations } from "next-intl";

interface ReportBlockProps {
  title: string;
  // renderProps pattern: truyền hàm render xuống làm prop
  renderTable: () => React.ReactNode;
  renderChart?: () => React.ReactNode; // Biểu đồ là tùy chọn
}

const ReportBlock: React.FC<ReportBlockProps> = ({
  title,
  renderTable,
  renderChart,
}) => {
  const t = useTranslations("AdminReports.shared");
  // Mặc định là 'table', chỉ chuyển sang 'chart' nếu có renderChart
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  return (
    <div className="h-100 rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {/* Chỉ hiển thị nút chuyển đổi nếu có biểu đồ */}
        {renderChart && (
          <CButtonGroup role="group" size="sm">
            <CButton
              color="secondary"
              variant="outline"
              active={viewMode === "table"} // ✅ sử dụng prop active
              onClick={() => setViewMode("table")}
              title={t("viewAsTable")}
            >
              <CIcon icon={cilList} />
            </CButton>
            <CButton
              color="secondary"
              variant="outline"
              active={viewMode === "chart"}
              onClick={() => setViewMode("chart")}
              title={t("viewAsChart")}
            >
              <CIcon icon={cilChart} />
            </CButton>
          </CButtonGroup>
        )}
      </div>

      {/* Render nội dung dựa trên viewMode */}
      <div>
        {viewMode === "chart" && renderChart ? renderChart() : renderTable()}
      </div>
    </div>
  );
};

export default ReportBlock;
