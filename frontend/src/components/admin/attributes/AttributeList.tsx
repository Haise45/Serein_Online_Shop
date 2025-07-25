import { AttributeAdmin } from "@/types";
import { cilPlus } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CCard,
  CCardHeader,
  CListGroup,
  CListGroupItem,
} from "@coreui/react";
import React from "react";
import { useLocale } from "next-intl";
import { getLocalizedName } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AttributeListProps {
  attributes: AttributeAdmin[];
  selectedAttributeId: string | null;
  onSelectAttribute: (attribute: AttributeAdmin) => void;
  onAddNewAttribute: () => void;
}

const AttributeList: React.FC<AttributeListProps> = ({
  attributes,
  selectedAttributeId,
  onSelectAttribute,
  onAddNewAttribute,
}) => {
  const locale = useLocale() as "vi" | "en";
  const t = useTranslations("AdminAttributes.attributeList");

  return (
    <CCard>
      <CCardHeader className="flex items-center justify-between">
        <h5 className="mb-0">{t("title")}</h5>
        <CButton size="sm" color="primary" onClick={onAddNewAttribute}>
          <CIcon icon={cilPlus} className="mr-1" /> {t("add")}
        </CButton>
      </CCardHeader>
      <CListGroup flush>
        {attributes.map((attr) => (
          <CListGroupItem
            key={attr._id}
            as="button"
            active={selectedAttributeId === attr._id}
            onClick={() => onSelectAttribute(attr)}
            className="flex items-center justify-between"
          >
            {getLocalizedName(attr.label, locale)}
            <span className="me-2 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {attr.values.length}
            </span>
          </CListGroupItem>
        ))}
      </CListGroup>
    </CCard>
  );
};

export default AttributeList;
