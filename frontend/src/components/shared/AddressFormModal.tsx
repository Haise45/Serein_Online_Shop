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
import { FiLoader, FiX } from "react-icons/fi";

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: Address | null;
  onAddressSaved: (savedAddress: Address, isNew: boolean) => void; // Callback khi lưu thành công
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
      // Reset form khi mở để thêm mới
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
  }, [addressToEdit, isOpen]); // Chạy khi addressToEdit hoặc isOpen thay đổi

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
        setFormData((prev) => ({ ...prev, districtCode: "", communeCode: "" })); // Reset district & commune
        setSelectedDistrictName("");
        setSelectedCommuneName("");
        const province = provinces?.find((p) => p.code === value);
        setSelectedProvinceName(province?.name || "");
      } else if (name === "districtCode") {
        setFormData((prev) => ({ ...prev, communeCode: "" })); // Reset commune
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
      // Type cho API service
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
      // Cập nhật địa chỉ
      updateAddressMutation.mutate(
        { addressId: addressToEdit._id.toString(), addressData: payloadForApi },
        {
          onSuccess: (updatedAddresses) => {
            const saved =
              updatedAddresses.find(
                (a) => a._id?.toString() === addressToEdit._id!.toString(),
              ) || (payloadForApi as Address);
            onAddressSaved(saved, false); // false vì là cập nhật
          },
        },
      );
    } else {
      // Thêm địa chỉ mới
      addAddressMutation.mutate(payloadForApi as Omit<Address, "_id">, {
        // Cast để loại bỏ _id
        onSuccess: (updatedAddresses) => {
          // Tìm địa chỉ vừa thêm trong danh sách trả về (thường là cái cuối cùng nếu backend trả về đúng)
          // Hoặc API thêm địa chỉ nên trả về chính địa chỉ vừa tạo
          const newAddress =
            updatedAddresses.find(
              (a) =>
                a.street === payloadForApi.street &&
                a.communeCode === payloadForApi.communeCode &&
                a.fullName === payloadForApi.fullName, // Giả định street + commune + fullName là đủ để tìm
            ) || ({ ...payloadForApi, _id: `temp-${Date.now()}` } as Address); // Fallback
          onAddressSaved(newAddress, true); // true vì là thêm mới
        },
      });
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop: Sử dụng DialogBackdrop */}
        <DialogBackdrop
          transition // Bật transition cho backdrop
          className="fixed inset-0 bg-black/30 transition-opacity duration-300 ease-out data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            {/* Panel: Sử dụng DialogPanel */}
            <DialogPanel
              transition // Bật transition cho panel
              className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
            >
              {/* Title: Sử dụng DialogTitle */}
              <DialogTitle
                as="h3"
                className="flex items-center justify-between text-lg leading-6 font-semibold text-gray-900"
              >
                {addressToEdit ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Đóng" // Thêm aria-label cho button icon
                >
                  <FiX />
                </button>
              </DialogTitle>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Họ tên */}
                <div>
                  <label htmlFor="fullName" className="form-label">
                    Họ và tên người nhận
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    id="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                {/* Số điện thoại */}
                <div>
                  <label htmlFor="phone" className="form-label">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                {/* Tỉnh/Thành phố */}
                <div>
                  <label htmlFor="provinceCode" className="form-label">
                    Tỉnh/Thành phố
                  </label>
                  <select
                    name="provinceCode"
                    id="provinceCode"
                    value={formData.provinceCode}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={isLoadingProvinces}
                  >
                    <option value="">
                      {isLoadingProvinces ? "Đang tải..." : "Chọn Tỉnh/Thành"}
                    </option>
                    {provinces?.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Quận/Huyện */}
                <div>
                  <label htmlFor="districtCode" className="form-label">
                    Quận/Huyện
                  </label>
                  <select
                    name="districtCode"
                    id="districtCode"
                    value={formData.districtCode}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={!formData.provinceCode || isLoadingDistricts}
                  >
                    <option value="">
                      {isLoadingDistricts ? "Đang tải..." : "Chọn Quận/Huyện"}
                    </option>
                    {districts?.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Phường/Xã */}
                <div>
                  <label htmlFor="communeCode" className="form-label">
                    Phường/Xã
                  </label>
                  <select
                    name="communeCode"
                    id="communeCode"
                    value={formData.communeCode}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={!formData.districtCode || isLoadingCommunes}
                  >
                    <option value="">
                      {isLoadingCommunes ? "Đang tải..." : "Chọn Phường/Xã"}
                    </option>
                    {communes?.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Địa chỉ cụ thể */}
                <div>
                  <label htmlFor="street" className="form-label">
                    Địa chỉ cụ thể (Số nhà, tên đường...)
                  </label>
                  <input
                    type="text"
                    name="street"
                    id="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                {/* Đặt làm mặc định */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isDefault"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="isDefault"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isMutating}
                  >
                    {isMutating && (
                      <FiLoader className="mr-2 -ml-1 h-4 w-4 animate-spin" />
                    )}
                    {addressToEdit ? "Lưu thay đổi" : "Thêm địa chỉ"}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
