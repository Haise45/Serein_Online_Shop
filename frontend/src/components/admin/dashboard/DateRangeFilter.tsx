"use client";

import { CCol, CFormInput, CFormSelect, CRow } from "@coreui/react";
import { sub, format } from "date-fns";
import React from "react";
import { startOfQuarter, endOfQuarter, subQuarters } from "date-fns";

interface DateRangeFilterProps {
  value: { startDate?: string; endDate?: string };
  onChange: React.Dispatch<
    React.SetStateAction<{ startDate: string; endDate: string }>
  >;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
}) => {
  const setPresetRange = (preset: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (preset) {
      case "this_week":
        startDate = sub(now, { days: now.getDay() }); // Bắt đầu từ Chủ Nhật
        break;
      case "last_7_days":
        startDate = sub(now, { days: 6 });
        break;
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "this_quarter":
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      case "last_quarter":
        const lastQuarterDate = subQuarters(now, 1);
        startDate = startOfQuarter(lastQuarterDate);
        endDate = endOfQuarter(lastQuarterDate);
        break;
      case "last_30_days":
        startDate = sub(now, { days: 30 });
        break;
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }
    onChange({
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
  };

  return (
    <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
      <CRow className="g-3 align-items-center">
        <CCol md={3}>
          <CFormInput
            type="date"
            label="Từ ngày"
            value={value.startDate || ""}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, startDate: e.target.value }))
            }
          />
        </CCol>
        <CCol md={3}>
          <CFormInput
            type="date"
            label="Đến ngày"
            value={value.endDate || ""}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, endDate: e.target.value }))
            }
          />
        </CCol>
        <CCol md={4}>
          <CFormSelect
            label="Chọn nhanh"
            onChange={(e) => setPresetRange(e.target.value)}
            aria-label="Chọn nhanh khoảng thời gian"
          >
            <option value="last_7_days">7 ngày qua</option>
            <option value="last_30_days">30 ngày qua</option>
            <option value="this_month">Tháng này</option>
            <option value="this_quarter">Quý này</option>
            <option value="last_quarter">Quý trước</option>
            <option value="this_year">Năm này</option>
          </CFormSelect>
        </CCol>
      </CRow>
    </div>
  );
};

export default DateRangeFilter;
