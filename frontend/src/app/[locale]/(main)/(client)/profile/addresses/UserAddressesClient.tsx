"use client";

import AddressCard from "@/components/client/profile/addresses/AddressCard";
import AddressFormModal from "@/components/shared/AddressFormModal";
import {
  useDeleteAddress,
  useGetUserAddresses,
  useSetDefaultAddress,
} from "@/lib/react-query/userQueries";
import { Address } from "@/types/user";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle, FiMapPin, FiPlusCircle } from "react-icons/fi";
import { useTranslations } from "next-intl";

export default function UserAddressesClient() {
  const t = useTranslations("AddressPage");
  const { data: addresses, isLoading, isError, error } = useGetUserAddresses();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

  // State để theo dõi ID đang được xử lý cho từng hành động
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setAddressToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (address: Address) => {
    setAddressToEdit(address);
    setIsModalOpen(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    toast(
      (toastInstance) => (
        <div className="flex flex-col items-center p-1">
          <p className="mb-3 text-sm font-medium text-gray-800">
            {t("deleteConfirmTitle")}
          </p>
          <div className="flex w-full space-x-3">
            <button
              onClick={() => {
                setDeletingId(addressId); // Đặt ID để AddressCard biết cái nào đang được xóa
                deleteAddressMutation.mutate(addressId, {
                  onSettled: () => {
                    setDeletingId(null); // Dọn dẹp ID sau khi hoàn tất
                  },
                });
                toast.dismiss(toastInstance.id);
              }}
              className="flex-1 rounded-md bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {t("deleteConfirmButton")}
            </button>
            <button
              onClick={() => toast.dismiss(toastInstance.id)}
              className="flex-1 rounded-md bg-white px-3.5 py-2 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
            >
              {t("cancelButton")}
            </button>
          </div>
        </div>
      ),
      {
        duration: 60000, // Toast sẽ tồn tại trong 60s hoặc cho đến khi người dùng tương tác
        icon: <FiAlertCircle className="h-6 w-6 text-orange-500" />,
        position: "top-center", // Hiển thị toast ở giữa trên cùng
      },
    );
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    setSettingDefaultId(addressId);
    setDefaultAddressMutation.mutate(addressId, {
      onSettled: () => {
        setSettingDefaultId(null); // Dọn dẹp ID sau khi hoàn tất
      },
    });
  };

  const handleAddressSaved = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="h-5 w-3/4 rounded bg-gray-200"></div>
            <div className="h-3 w-1/2 rounded bg-gray-200"></div>
            <div className="h-3 w-full rounded bg-gray-200"></div>
            <div className="h-3 w-2/3 rounded bg-gray-200"></div>
            <div className="mt-2 h-6 w-1/3 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-6 rounded-md bg-red-50 p-4 text-center">
        <FiAlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm text-red-600">
          {t("loadingError", { error: error?.message })}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {addresses && addresses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address._id!.toString()}
              address={address}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefaultAddress}
              isDeleting={deleteAddressMutation.isPending} // Trạng thái chung của mutation
              isSettingDefault={setDefaultAddressMutation.isPending} // Trạng thái chung của mutation
              currentDeletingId={deletingId} // ID cụ thể đang xóa
              currentSettingDefaultId={settingDefaultId} // ID cụ thể đang đặt mặc định
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-10 text-center">
          <FiMapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t("noAddressesTitle")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("noAddressesSubtitle")}
          </p>
        </div>
      )}

      {isModalOpen && (
        <AddressFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          addressToEdit={addressToEdit}
          onAddressSaved={handleAddressSaved}
        />
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          <FiPlusCircle className="mr-2 -ml-1 h-5 w-5" />
          {t("addAddressButton")}
        </button>
      </div>
    </div>
  );
}
