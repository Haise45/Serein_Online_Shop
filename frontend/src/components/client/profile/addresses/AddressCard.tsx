"use client";

import { Address } from "@/types/user";
import classNames from "classnames";
import { FiCheckCircle, FiEdit3, FiLoader, FiTrash2 } from "react-icons/fi";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  isDeleting: boolean;
  isSettingDefault: boolean;
  currentDeletingId: string | null;
  currentSettingDefaultId: string | null;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting,
  isSettingDefault,
  currentDeletingId,
  currentSettingDefaultId,
}) => {
  // Check if this specific card is being processed
  const isThisCardDeleting =
    isDeleting && currentDeletingId === address._id?.toString();
  const isThisCardSettingDefault =
    isSettingDefault && currentSettingDefaultId === address._id?.toString();
  const isProcessingThisCard = isThisCardDeleting || isThisCardSettingDefault;

  return (
    <div
      className={classNames(
        "rounded-lg border bg-white p-4 shadow-sm transition-all duration-150",
        address.isDefault
          ? "border-indigo-500 ring-2 ring-indigo-300"
          : "border-gray-200 hover:shadow-md",
        { "pointer-events-none opacity-70": isProcessingThisCard },
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center text-base font-semibold text-gray-800">
            {address.fullName}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {address.phone}
            {address.isDefault && (
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                <FiCheckCircle className="mr-1 h-3 w-3" /> Mặc định
              </span>
            )}
          </p>
        </div>
        <div className="flex-shrink-0 space-x-2">
          <button
            onClick={() => onEdit(address)}
            disabled={isProcessingThisCard}
            className="p-1 text-gray-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            title="Sửa địa chỉ"
          >
            <FiEdit3 className="h-4 w-4" />
          </button>
          {!address.isDefault && (
            <button
              onClick={() => onDelete(address._id!.toString())}
              disabled={isProcessingThisCard}
              className="p-1 text-gray-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              title="Xóa địa chỉ"
            >
              {isThisCardDeleting ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiTrash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
      <address className="mt-2 text-[13px] text-gray-600 not-italic">
        {address.street}
        <br />
        {address.communeName}, {address.districtName}
        <br />
        {address.provinceName}
      </address>
      {!address.isDefault && (
        <button
          onClick={() => onSetDefault(address._id!.toString())}
          disabled={isProcessingThisCard}
          className="mt-3 text-[13px] font-medium text-indigo-600 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isThisCardSettingDefault ? (
            <FiLoader className="mr-1 inline-block h-3 w-3 animate-spin" />
          ) : null}
          Đặt làm mặc định
        </button>
      )}
    </div>
  );
};

export default AddressCard;
