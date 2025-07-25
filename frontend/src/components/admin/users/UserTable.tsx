"use client";

import { useSettings } from "@/app/SettingsContext";
import RelativeTime from "@/components/shared/RelativeTime";
import { formatCurrency, maskString } from "@/lib/utils";
import { User } from "@/types";
import { cilCheckCircle, cilPen, cilTrash } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CAvatar,
  CBadge,
  CButton,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from "@coreui/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

interface UserTableProps {
  users: User[];
  onStatusChangeClick: (user: User) => void;
  queryString: string;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onStatusChangeClick,
  queryString,
}) => {
  // *** SỬ DỤNG CONTEXT ĐỂ LẤY THÔNG TIN TIỀN TỆ ***
  const { displayCurrency, rates } = useSettings();
  const t = useTranslations("AdminUsers.table");
  const locale = useLocale();

  return (
    <CTable hover responsive className="align-middle">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>{t("colUser")}</CTableHeaderCell>
          <CTableHeaderCell>{t("colContact")}</CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colOrders")}
          </CTableHeaderCell>
          <CTableHeaderCell className="text-end">
            {t("colTotalSpent")}
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colRole")}
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colStatus")}
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colJoined")}
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            {t("colActions")}
          </CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {users.map((user) => (
          <CTableRow key={user._id}>
            <CTableDataCell>
              <div className="d-flex align-items-center">
                <CAvatar
                  color="secondary"
                  textColor="white"
                  size="md"
                  className="me-3"
                >
                  {user.name.charAt(0).toUpperCase()}
                </CAvatar>
                <div>
                  <div className="fw-medium">{user.name}</div>
                  <div className="text-muted text-xs">
                    ID: {user._id.slice(-6)}
                  </div>
                </div>
              </div>
            </CTableDataCell>
            <CTableDataCell>
              <div>{maskString(user.email, 3, 4)}</div>
              <div className="text-muted text-xs">
                {maskString(user.phone, 3, 3)}
              </div>
            </CTableDataCell>
            <CTableDataCell className="fw-medium text-center">
              {user.orderCount ?? 0}
            </CTableDataCell>
            <CTableDataCell className="text-end">
              <span className="fw-semibold text-gray-800">
                {formatCurrency(user.totalSpent ?? 0, {
                  currency: displayCurrency,
                  rates,
                })}
              </span>
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <CBadge color={user.role === "admin" ? "danger" : "info"}>
                {user.role === "admin" ? t("roleAdmin") : t("roleCustomer")}
              </CBadge>
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <CBadge color={user.isActive ? "success" : "danger"}>
                {user.isActive ? t("statusActive") : t("statusSuspended")}
              </CBadge>
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <div title={new Date(user.createdAt!).toLocaleString(locale)}>
                <RelativeTime date={user.createdAt!} />
              </div>
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <div className="d-flex justify-content-center gap-2">
                <CTooltip content={t("tooltipEdit")}>
                  <Link href={`/admin/users/${user._id}?${queryString}`}>
                    <CButton
                      color="info"
                      variant="outline"
                      size="sm"
                      className="p-2"
                    >
                      <CIcon icon={cilPen} size="sm" />
                    </CButton>
                  </Link>
                </CTooltip>
                <CTooltip
                  content={
                    user.isActive ? t("tooltipSuspend") : t("tooltipReactivate")
                  }
                >
                  <CButton
                    color={user.isActive ? "danger" : "success"}
                    variant="outline"
                    size="sm"
                    className="p-2"
                    onClick={() => onStatusChangeClick(user)}
                    disabled={user.role === "admin"}
                  >
                    <CIcon
                      icon={user.isActive ? cilTrash : cilCheckCircle}
                      size="sm"
                    />
                  </CButton>
                </CTooltip>
              </div>
            </CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  );
};

export default UserTable;
