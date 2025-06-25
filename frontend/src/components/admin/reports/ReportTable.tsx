"use client";

import {
  CSpinner,
  CTable,
  CTableBody,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from "@coreui/react";
import React from "react";

// T sẽ đại diện cho kiểu của mỗi item trong mảng items
interface ReportTableProps<T> {
  headers: { key: string; label: string; className?: string }[];
  items: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  isLoading: boolean;
  title?: string;
  noDataMessage?: string;
}

// Component giờ là một generic component
const ReportTable = <T extends { _id?: string }>({
  headers,
  items,
  renderRow,
  isLoading,
  title,
  noDataMessage = "Không có dữ liệu.",
}: ReportTableProps<T>) => {
  return (
    <div className="h-100 rounded-lg border bg-white p-4 shadow-sm">
      {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
      {isLoading ? (
        <div className="p-5 text-center">
          <CSpinner />
        </div>
      ) : items.length === 0 ? (
        <p className="py-5 text-center text-gray-500">{noDataMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <CTable hover responsive className="mb-0 align-middle text-sm">
            <CTableHead>
              <CTableRow>
                {headers.map((header) => (
                  <CTableHeaderCell
                    key={header.key}
                    className={header.className}
                  >
                    {header.label}
                  </CTableHeaderCell>
                ))}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {items.map((item, index) => renderRow(item, index))}
            </CTableBody>
          </CTable>
        </div>
      )}
    </div>
  );
};

export default ReportTable;
