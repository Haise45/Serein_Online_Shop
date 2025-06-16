import { Attribute } from "@/types";
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

interface AttributeListProps {
  attributes: Attribute[];
  selectedAttributeId: string | null;
  onSelectAttribute: (attribute: Attribute) => void;
  onAddNewAttribute: () => void;
}

const AttributeList: React.FC<AttributeListProps> = ({
  attributes,
  selectedAttributeId,
  onSelectAttribute,
  onAddNewAttribute,
}) => {
  return (
    <CCard>
      <CCardHeader className="flex items-center justify-between">
        <h5 className="mb-0">Thuộc tính</h5>
        <CButton size="sm" color="primary" onClick={onAddNewAttribute}>
          <CIcon icon={cilPlus} className="mr-1" /> Thêm
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
            {attr.label}
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
