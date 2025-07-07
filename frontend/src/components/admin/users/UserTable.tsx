"use client";

import { useSettings } from "@/app/SettingsContext";
import { formatCurrency, maskString, timeAgo } from "@/lib/utils";
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
  
  return (
    <CTable hover responsive className="align-middle">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Người dùng</CTableHeaderCell>
          <CTableHeaderCell>Liên hệ</CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            Số đơn hàng
          </CTableHeaderCell>
          <CTableHeaderCell className="text-end">
            Tổng chi tiêu
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">Vai trò</CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            Trạng thái
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">
            Ngày tham gia
          </CTableHeaderCell>
          <CTableHeaderCell className="text-center">Hành động</CTableHeaderCell>
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
                {formatCurrency(user.totalSpent ?? 0, { currency: displayCurrency, rates })}
              </span>
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <CBadge color={user.role === "admin" ? "danger" : "info"}>
                {user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
              </CBadge>
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <CBadge color={user.isActive ? "success" : "danger"}>
                {user.isActive ? "Hoạt động" : "Đình chỉ"}
              </CBadge>
            </CTableDataCell>
            <CTableDataCell className="text-center">
              {timeAgo(user.createdAt!)}
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <div className="d-flex justify-content-center gap-2">
                <CTooltip content="Xem chi tiết và chỉnh sửa">
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
                    user.isActive ? "Đình chỉ người dùng" : "Kích hoạt lại"
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
