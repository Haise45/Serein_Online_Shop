import {
  CCol,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CRow,
} from "@coreui/react";
import React from "react";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemType?: string; // Tên loại item, ví dụ: "sản phẩm"
}

const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  itemType = "mục",
}) => {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="border-top bg-light px-4 py-3">
      <CRow className="align-items-center gy-3">
        {/* Cột bên trái: Hiển thị thông tin */}
        <CCol xs={12} md="auto" className="flex-grow-1">
          <div className="text-muted text-md-start text-center text-sm">
            Hiển thị {(currentPage - 1) * limit + 1} -{" "}
            {Math.min(currentPage * limit, totalItems)} trên tổng số{" "}
            {totalItems} {itemType}
          </div>
        </CCol>

        {/* Cột bên phải: Chứa các control */}
        <CCol xs={12} md="auto">
          <div className="d-flex align-items-center justify-content-center justify-content-md-end gap-4">
            {/* Group: Limit Selector */}
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted text-sm">Hiển thị</span>
              <CFormSelect
                size="sm"
                style={{ width: "75px" }}
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </CFormSelect>
              <span className="text-muted d-none d-sm-inline text-sm">
                mục/trang
              </span>
            </div>

            {/* Group: Pagination buttons */}
            <CPagination aria-label="Data list navigation" className="mb-0">
              <CPaginationItem
                aria-label="Previous"
                disabled={currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="user-select-none"
              >
                <span aria-hidden="true">«</span>
              </CPaginationItem>

              {(() => {
                const pages = [];
                const showPages = 5;
                let startPage = Math.max(
                  1,
                  currentPage - Math.floor(showPages / 2),
                );
                const endPage = Math.min(totalPages, startPage + showPages - 1);

                if (endPage - startPage < showPages - 1) {
                  startPage = Math.max(1, endPage - showPages + 1);
                }

                if (startPage > 1) {
                  pages.push(
                    <CPaginationItem
                      key={1}
                      active={currentPage === 1}
                      onClick={() => onPageChange(1)}
                      className="user-select-none"
                    >
                      1
                    </CPaginationItem>,
                  );
                  if (startPage > 2) {
                    pages.push(
                      <CPaginationItem key="start-ellipsis" disabled>
                        ...
                      </CPaginationItem>,
                    );
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <CPaginationItem
                      key={i}
                      active={currentPage === i}
                      onClick={() => onPageChange(i)}
                      className="user-select-none"
                    >
                      {i}
                    </CPaginationItem>,
                  );
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <CPaginationItem key="end-ellipsis" disabled>
                        ...
                      </CPaginationItem>,
                    );
                  }
                  pages.push(
                    <CPaginationItem
                      key={totalPages}
                      active={currentPage === totalPages}
                      onClick={() => onPageChange(totalPages)}
                      className="user-select-none"
                    >
                      {totalPages}
                    </CPaginationItem>,
                  );
                }
                return pages;
              })()}

              <CPaginationItem
                aria-label="Next"
                disabled={currentPage === totalPages}
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                className="user-select-none"
              >
                <span aria-hidden="true">»</span>
              </CPaginationItem>
            </CPagination>
          </div>
        </CCol>
      </CRow>
    </div>
  );
};

export default DataTablePagination;
