import { AttributeAdmin, AttributeValueAdmin } from "@/types";
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
import { useLocale } from "next-intl";
import { getLocalizedName } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AttributeValueTableProps {
  selectedAttribute: AttributeAdmin;
  onAddValue: () => void;
  onEditValue: (value: AttributeValueAdmin) => void;
  onDeleteValue: (value: AttributeValueAdmin) => void;
}

const AttributeValueTable: React.FC<AttributeValueTableProps> = ({
  selectedAttribute,
  onAddValue,
  onEditValue,
  onDeleteValue,
}) => {
  const locale = useLocale() as "vi" | "en";
  const t = useTranslations("AdminAttributes.valueTable");

  return (
    <CCard>
      <CCardHeader className="flex items-center justify-between">
        <h5 className="mb-0">
          {t.rich("title", {
            label: getLocalizedName(selectedAttribute.label, locale),
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </h5>
        <CButton size="sm" color="primary" onClick={onAddValue}>
          <CIcon icon={cilPlus} className="mr-1" /> {t("add")}
        </CButton>
      </CCardHeader>
      <CCardBody>
        {selectedAttribute.values.length > 0 ? (
          <CTable hover align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>{t("colValue")}</CTableHeaderCell>
                <CTableHeaderCell>{t("colHex")}</CTableHeaderCell>
                <CTableHeaderCell className="text-center">
                  {t("colActions")}
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
                      <p className="mb-0 font-medium">
                        {getLocalizedName(val.value, locale)}
                      </p>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="flex items-center">
                        {hexColor && (
                          <span
                            className="mr-2 h-5 w-5 rounded-full border"
                            style={{ backgroundColor: hexColor }}
                          ></span>
                        )}
                        <code>{hexColor || t("noHex")}</code>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CButton
                        size="sm"
                        color="info"
                        variant="outline"
                        className="me-2"
                        title={t("editTitle")}
                        onClick={() => onEditValue(val)}
                      >
                        <CIcon icon={cilPen} />
                      </CButton>
                      <CButton
                        size="sm"
                        color="danger"
                        variant="outline"
                        title={t("deleteTitle")}
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
            {t.rich("noValues", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default AttributeValueTable;
