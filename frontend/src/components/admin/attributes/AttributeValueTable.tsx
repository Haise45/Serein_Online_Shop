import { Attribute, AttributeValue } from "@/types";
import { cilPen, cilPlus, cilTrash } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from "@coreui/react";
import React from "react";

interface AttributeValueTableProps {
  selectedAttribute: Attribute;
  onAddValue: () => void;
  onEditValue: (value: AttributeValue) => void;
  onDeleteValue: (value: AttributeValue) => void;
}

const AttributeValueTable: React.FC<AttributeValueTableProps> = ({
  selectedAttribute,
  onAddValue,
  onEditValue,
  onDeleteValue,
}) => {
  return (
    <CCard>
      <CCardHeader className="flex items-center justify-between">
        <h5 className="mb-0">
          Giá trị cho: <strong>{selectedAttribute.label}</strong>
        </h5>
        <CButton size="sm" color="primary" onClick={onAddValue}>
          <CIcon icon={cilPlus} className="mr-1" /> Thêm giá trị
        </CButton>
      </CCardHeader>
      <CCardBody>
        {selectedAttribute.values.length > 0 ? (
          <CTable hover align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Giá trị</CTableHeaderCell>
                <CTableHeaderCell>Mã màu</CTableHeaderCell>
                <CTableHeaderCell className="text-center">
                  Hành động
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {selectedAttribute.values.map((val) => {
                const hexColor =
                  val.meta && typeof val.meta.hex === "string"
                    ? val.meta.hex
                    : null;
                return (
                  <CTableRow key={val._id}>
                    <CTableDataCell>
                      <strong>{val.value}</strong>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="flex items-center">
                        {hexColor && (
                          <span
                            className="mr-2 h-5 w-5 rounded-full border"
                            style={{ backgroundColor: hexColor }}
                          ></span>
                        )}
                        <code>{hexColor || "N/A"}</code>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CButton
                        size="sm"
                        color="info"
                        variant="outline"
                        className="mr-2"
                        title="Sửa"
                        onClick={() => onEditValue(val)}
                      >
                        <CIcon icon={cilPen} />
                      </CButton>
                      <CButton
                        size="sm"
                        color="danger"
                        variant="outline"
                        title="Xóa"
                        onClick={() => onDeleteValue(val)}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                );
              })}
            </CTableBody>
          </CTable>
        ) : (
          <div className="py-5 text-center text-gray-500">
            Chưa có giá trị nào. Nhấn <strong>Thêm giá trị</strong> để bắt đầu.
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default AttributeValueTable;
