"use client";

import { useSettings } from "@/app/SettingsContext";
import DataTablePagination from "@/components/admin/layout/DataTablePagination";
import UserOrdersTable from "@/components/admin/users/UserOrdersTable";
import { useGetUserDetailsAdmin } from "@/lib/react-query/userQueries";
import { formatCurrency } from "@/lib/utils";
import { AppDispatch } from "@/store";
import {
  clearBreadcrumbDynamicData,
  setBreadcrumbDynamicData,
} from "@/store/slices/breadcrumbAdminSlice";
import {
  CAvatar,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CRow,
  CSpinner,
} from "@coreui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

interface AdminUserDetailClientProps {
  userId: string;
}

const AdminUserDetailClient: React.FC<AdminUserDetailClientProps> = ({
  userId,
}) => {
  const { settings, displayCurrency, rates } = useSettings();
  const [currentPage, setCurrentPage] = useState(1);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Lấy giá trị limit mặc định từ settings, với giá trị dự phòng là 10
  const defaultLimitFromSettings =
    settings?.adminTable?.defaultItemsPerPage || 10;

  // 2. Tạo state để quản lý limit, khởi tạo với giá trị từ settings
  const [limit, setLimit] = useState(defaultLimitFromSettings);

  // 3. Sử dụng useEffect để cập nhật state `limit` nếu giá trị từ settings thay đổi (ví dụ: khi settings được tải xong)
  useEffect(() => {
    setLimit(defaultLimitFromSettings);
  }, [defaultLimitFromSettings]);

  // 4. Dùng state `limit` trong query để lấy dữ liệu
  const { data, isLoading, isError, error } = useGetUserDetailsAdmin(userId, {
    page: currentPage,
    limit: limit,
  });

  // 5. Hàm xử lý khi người dùng thay đổi limit trong dropdown
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi limit
  };

  const backLink = `/admin/users?${searchParams.toString()}`;

  useEffect(() => {
    if (data?.user?.name) {
      dispatch(setBreadcrumbDynamicData({ userName: data.user.name }));
    }

    // Cleanup function: sẽ chạy khi component unmount (rời khỏi trang)
    return () => {
      dispatch(clearBreadcrumbDynamicData());
    };
  }, [data?.user?.name, dispatch]);

  if (isLoading)
    return (
      <div className="p-10 text-center">
        <CSpinner />
      </div>
    );
  if (isError)
    return (
      <div className="p-10 text-center text-red-600">Lỗi: {error.message}</div>
    );
  if (!data)
    return <div className="p-10 text-center">Không tìm thấy người dùng.</div>;

  const { user, orders } = data;

  return (
    <div className="space-y-6">
      <div className="mb-3">
        <CButton
          color="secondary"
          variant="outline"
          onClick={() => router.push(backLink)}
        >
          ← Quay lại danh sách
        </CButton>
      </div>

      <CRow>
        {/* Cột thông tin chi tiết */}
        <CCol lg={4}>
          <CCard className="mb-4 shadow-sm">
            <CCardBody>
              <div className="flex flex-col items-center text-center">
                <CAvatar
                  color="secondary"
                  textColor="white"
                  size="xl"
                  className="mb-3"
                >
                  {user.name.charAt(0).toUpperCase()}
                </CAvatar>
                <h5 className="mb-1">{user.name}</h5>
                <p className="text-muted mb-2">{user.email}</p>
                <CBadge color={user.isActive ? "success" : "danger"}>
                  {user.isActive ? "Hoạt động" : "Đình chỉ"}
                </CBadge>
              </div>
              <hr className="my-4" />
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Vai trò:</strong>{" "}
                  {user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                </p>
                <p>
                  <strong>Điện thoại:</strong> {user.phone}
                </p>
                <p>
                  <strong>Ngày tham gia:</strong>{" "}
                  {new Date(user.createdAt!).toLocaleDateString("vi-VN")}
                </p>
                <p>
                  <strong>Tổng chi tiêu:</strong>{" "}
                  <span className="fw-semibold text-gray-800">
                    {formatCurrency(user.totalSpent ?? 0, {
                      currency: displayCurrency,
                      rates,
                    })}
                  </span>
                </p>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Cột danh sách đơn hàng */}
        <CCol lg={8}>
          <CCard className="shadow-sm">
            <CCardBody>
              <h5 className="mb-4 font-semibold">
                Lịch sử đơn hàng ({orders.totalOrders})
              </h5>
              {orders.items.length > 0 ? (
                <>
                  <UserOrdersTable orders={orders.items} />
                  <div className="mt-4">
                    {/* 6. Truyền state và handler mới vào component phân trang */}
                    <DataTablePagination
                      currentPage={orders.currentPage}
                      totalPages={orders.totalPages}
                      totalItems={orders.totalOrders}
                      limit={limit}
                      onPageChange={setCurrentPage}
                      onLimitChange={handleLimitChange}
                      itemType="đơn hàng"
                      defaultLimitFromSettings={defaultLimitFromSettings}
                    />
                  </div>
                </>
              ) : (
                <p className="py-5 text-center text-gray-500">
                  Người dùng này chưa có đơn hàng nào.
                </p>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default AdminUserDetailClient;
