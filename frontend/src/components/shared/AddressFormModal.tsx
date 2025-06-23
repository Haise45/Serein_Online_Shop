"use client";

import {
  useGetCommunes,
  useGetDistricts,
  useGetProvinces,
} from "@/lib/react-query/locationQueries";
import { useAddAddress, useUpdateAddress } from "@/lib/react-query/userQueries";
import { ShippingAddressData } from "@/types/order";
import { Address } from "@/types/user";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react";
import { FormEvent, Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiHome,
  FiLoader,
  FiMapPin,
  FiPhone,
  FiUser,
  FiX,
} from "react-icons/fi";

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: Address | null;
  onAddressSaved: (savedAddress: Address, isNew: boolean) => void;
}

type FormData = Omit<
  ShippingAddressData,
  "communeName" | "districtName" | "provinceName"
> & { isDefault?: boolean };

export default function AddressFormModal({
  isOpen,
  onClose,
  addressToEdit,
  onAddressSaved,
}: AddressFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    phone: "",
    street: "",
    provinceCode: "",
    districtCode: "",
    communeCode: "",
    isDefault: false,
  });
  const [selectedProvinceName, setSelectedProvinceName] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedCommuneName, setSelectedCommuneName] = useState("");

  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const isMutating =
    addAddressMutation.isPending || updateAddressMutation.isPending;

  const { data: provinces, isLoading: isLoadingProvinces } = useGetProvinces();
  const { data: districts, isLoading: isLoadingDistricts } = useGetDistricts(
    formData.provinceCode,
    { enabled: !!formData.provinceCode },
  );
  const { data: communes, isLoading: isLoadingCommunes } = useGetCommunes(
    formData.districtCode,
    { enabled: !!formData.districtCode },
  );

  useEffect(() => {
    if (addressToEdit) {
      setFormData({
        fullName: addressToEdit.fullName,
        phone: addressToEdit.phone,
        street: addressToEdit.street,
        provinceCode: addressToEdit.provinceCode,
        districtCode: addressToEdit.districtCode,
        communeCode: addressToEdit.communeCode,
        isDefault: addressToEdit.isDefault || false,
      });
      setSelectedProvinceName(addressToEdit.provinceName);
      setSelectedDistrictName(addressToEdit.districtName);
      setSelectedCommuneName(addressToEdit.communeName);
    } else {
      setFormData({
        fullName: "",
        phone: "",
        street: "",
        provinceCode: "",
        districtCode: "",
        communeCode: "",
        isDefault: false,
      });
      setSelectedProvinceName("");
      setSelectedDistrictName("");
      setSelectedCommuneName("");
    }
  }, [addressToEdit, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === "provinceCode") {
        setFormData((prev) => ({ ...prev, districtCode: "", communeCode: "" }));
        setSelectedDistrictName("");
        setSelectedCommuneName("");
        const province = provinces?.find((p) => p.code === value);
        setSelectedProvinceName(province?.name || "");
      } else if (name === "districtCode") {
        setFormData((prev) => ({ ...prev, communeCode: "" }));
        setSelectedCommuneName("");
        const district = districts?.find((d) => d.code === value);
        setSelectedDistrictName(district?.name || "");
      } else if (name === "communeCode") {
        const commune = communes?.find((c) => c.code === value);
        setSelectedCommuneName(commune?.name || "");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMutating) return;

    if (
      !formData.provinceCode ||
      !formData.districtCode ||
      !formData.communeCode
    ) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã.");
      return;
    }

    const payloadForApi: Omit<Address, "_id" | "countryCode"> & {
      _id?: string;
    } = {
      fullName: formData.fullName,
      phone: formData.phone,
      street: formData.street,
      provinceCode: formData.provinceCode,
      provinceName: selectedProvinceName,
      districtCode: formData.districtCode,
      districtName: selectedDistrictName,
      communeCode: formData.communeCode,
      communeName: selectedCommuneName,
      isDefault: formData.isDefault,
    };

    if (addressToEdit?._id) {
      updateAddressMutation.mutate(
        { addressId: addressToEdit._id.toString(), addressData: payloadForApi },
        {
          onSuccess: (updatedAddresses) => {
            const saved =
              updatedAddresses.find(
                (a) => a._id?.toString() === addressToEdit._id!.toString(),
              ) || (payloadForApi as Address);
            onAddressSaved(saved, false);
          },
        },
      );
    } else {
      addAddressMutation.mutate(payloadForApi as Omit<Address, "_id">, {
        onSuccess: (updatedAddresses) => {
          const newAddress =
            updatedAddresses.find(
              (a) =>
                a.street === payloadForApi.street &&
                a.communeCode === payloadForApi.communeCode &&
                a.fullName === payloadForApi.fullName,
            ) || ({ ...payloadForApi, _id: `temp-${Date.now()}` } as Address);
          onAddressSaved(newAddress, true);
        },
      });
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 ease-out data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel
              transition
              className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-0 text-left align-middle shadow-2xl transition-all duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              {/* Header với gradient */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-700 px-8 py-6 text-white">
                <DialogTitle
                  as="h3"
                  className="flex items-center justify-between text-xl font-bold"
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-white/20 p-2">
                      <FiMapPin className="h-5 w-5" />
                    </div>
                    <span>
                      {addressToEdit ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-white/80 transition-colors duration-200 hover:bg-white/20 hover:text-white"
                    aria-label="Đóng"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </DialogTitle>
                <p className="mt-2 text-sm text-indigo-100">
                  {addressToEdit
                    ? "Cập nhật thông tin địa chỉ giao hàng của bạn"
                    : "Thêm địa chỉ giao hàng mới vào danh sách của bạn"}
                </p>
              </div>

              {/* Form Content */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-800">
                      <FiUser className="h-5 w-5 text-indigo-600" />
                      <span>Thông tin người nhận</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Họ tên */}
                      <div className="space-y-2">
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Họ và tên người nhận *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="fullName"
                            id="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="block w-full rounded-lg border border-gray-200 p-3 pl-10 shadow-sm transition-colors duration-200 focus:border-indigo-600 focus:ring-indigo-600 focus:outline-none"
                            placeholder="Nhập họ và tên"
                            required
                          />
                          <FiUser className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-500" />
                        </div>
                      </div>

                      {/* Số điện thoại */}
                      <div className="space-y-2">
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Số điện thoại *
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="block w-full rounded-lg border border-gray-200 p-3 pl-10 shadow-sm transition-colors duration-200 focus:border-indigo-600 focus:ring-indigo-600 focus:outline-none"
                            placeholder="Nhập số điện thoại"
                            required
                          />
                          <FiPhone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="space-y-4">
                    <h4 className="flex items-center space-x-2 text-lg font-semibold text-gray-800">
                      <FiMapPin className="h-5 w-5 text-indigo-600" />
                      <span>Địa chỉ giao hàng</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {/* Tỉnh/Thành phố */}
                      <div className="space-y-2">
                        <label
                          htmlFor="provinceCode"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Tỉnh/Thành phố *
                        </label>
                        <select
                          name="provinceCode"
                          id="provinceCode"
                          value={formData.provinceCode}
                          onChange={handleChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-1 py-3 shadow-sm transition-colors duration-200 focus:border-indigo-600 focus:ring-indigo-600"
                          required
                          disabled={isLoadingProvinces}
                        >
                          <option value="">
                            {isLoadingProvinces
                              ? "Đang tải..."
                              : "Chọn Tỉnh/Thành"}
                          </option>
                          {provinces?.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quận/Huyện */}
                      <div className="space-y-2">
                        <label
                          htmlFor="districtCode"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Quận/Huyện *
                        </label>
                        <select
                          name="districtCode"
                          id="districtCode"
                          value={formData.districtCode}
                          onChange={handleChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-1 py-3 shadow-sm transition-colors duration-200 focus:border-indigo-600 focus:ring-indigo-600 disabled:bg-gray-50"
                          required
                          disabled={
                            !formData.provinceCode || isLoadingDistricts
                          }
                        >
                          <option value="">
                            {isLoadingDistricts
                              ? "Đang tải..."
                              : "Chọn Quận/Huyện"}
                          </option>
                          {districts?.map((d) => (
                            <option key={d.code} value={d.code}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Phường/Xã */}
                      <div className="space-y-2">
                        <label
                          htmlFor="communeCode"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Phường/Xã *
                        </label>
                        <select
                          name="communeCode"
                          id="communeCode"
                          value={formData.communeCode}
                          onChange={handleChange}
                          className="block w-full rounded-lg border border-gray-300 bg-white px-1 py-3 shadow-sm transition-colors duration-200 focus:border-indigo-600 focus:ring-indigo-600 disabled:bg-gray-50"
                          required
                          disabled={!formData.districtCode || isLoadingCommunes}
                        >
                          <option value="">
                            {isLoadingCommunes
                              ? "Đang tải..."
                              : "Chọn Phường/Xã"}
                          </option>
                          {communes?.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Địa chỉ cụ thể */}
                    <div className="space-y-2">
                      <label
                        htmlFor="street"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Địa chỉ cụ thể *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="street"
                          id="street"
                          value={formData.street}
                          onChange={handleChange}
                          className="block w-full rounded-lg border border-gray-200 p-3 pl-10 shadow-sm transition-colors duration-200 focus:border-indigo-600 focus:ring-indigo-600 focus:outline-none"
                          placeholder="Số nhà, tên đường, khu vực..."
                          required
                        />
                        <FiHome className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-500" />
                      </div>
                    </div>
                  </div>

                  {/* Default Address Checkbox */}
                  <div className="flex items-center rounded-lg bg-gray-50 p-4">
                    <input
                      type="checkbox"
                      name="isDefault"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="isDefault"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      Đặt làm địa chỉ mặc định
                    </label>
                    <span className="ml-2 text-xs text-gray-500">
                      (Địa chỉ này sẽ được chọn mặc định khi đặt hàng)
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-700 px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:from-indigo-600 hover:to-purple-800 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isMutating}
                    >
                      {isMutating && (
                        <FiLoader className="h-4 w-4 animate-spin" />
                      )}
                      <span>
                        {addressToEdit ? "Lưu thay đổi" : "Thêm địa chỉ"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
