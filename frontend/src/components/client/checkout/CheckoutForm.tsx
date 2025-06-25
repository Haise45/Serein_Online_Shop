"use client";

import AddressFormModal from "@/components/shared/AddressFormModal";
import {
  useGetCommunes,
  useGetDistricts,
  useGetProvinces,
} from "@/lib/react-query/locationQueries";
import { userKeys } from "@/lib/react-query/userQueries";
import { OrderCreationPayload, ShippingAddressData } from "@/types/order";
import { Address, User } from "@/types/user";
import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiCheck,
  FiCreditCard,
  FiEdit3,
  FiPlusCircle,
  FiTruck,
} from "react-icons/fi";
import { SiPaypal } from "react-icons/si";
import PayPalButtonsWrapper from "./PayPalButtonsWrapper";

interface CheckoutFormProps {
  user: User | null;
  userAddresses: Address[];
  isLoadingAddresses: boolean;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  onSubmitOrder: (
    formData: Omit<OrderCreationPayload, "selectedCartItemIds">,
  ) => void;
  isSubmittingOrder: boolean;
  setIsProcessingPayPal: (isProcessing: boolean) => void;
}

export const PAYMENT_METHODS = [
  {
    id: "COD",
    name: "Thanh toán khi nhận hàng (COD)",
    description: "Trả tiền mặt khi shipper giao hàng.",
    icon: FiTruck,
  },
  {
    id: "BANK_TRANSFER",
    name: "Chuyển khoản ngân hàng",
    description: "Thông tin chuyển khoản sẽ được cung cấp sau khi đặt hàng.",
    icon: FiCreditCard,
  },
  {
    id: "PAYPAL",
    name: "PayPal",
    description: "Thanh toán nhanh chóng và bảo mật qua PayPal.",
    icon: SiPaypal,
  },
];

// Tách component AddressInputFields ra ngoài để tránh re-create
const AddressInputFields: React.FC<{
  addressData: Partial<ShippingAddressData>;
  onDataChange: (field: keyof ShippingAddressData, value: string) => void;
  onFullDataChange: (data: Partial<ShippingAddressData>) => void;
}> = ({ addressData, onDataChange, onFullDataChange }) => {
  const [currentProvinceCode, setCurrentProvinceCode] = useState(
    addressData.provinceCode || "",
  );
  const [currentDistrictCode, setCurrentDistrictCode] = useState(
    addressData.districtCode || "",
  );

  const { data: provinces, isLoading: isLoadingProvinces } = useGetProvinces();
  const { data: districts, isLoading: isLoadingDistricts } = useGetDistricts(
    currentProvinceCode,
    { enabled: !!currentProvinceCode },
  );
  const { data: communes, isLoading: isLoadingCommunes } = useGetCommunes(
    currentDistrictCode,
    { enabled: !!currentDistrictCode },
  );

  useEffect(() => {
    setCurrentProvinceCode(addressData.provinceCode || "");
  }, [addressData.provinceCode]);

  useEffect(() => {
    setCurrentDistrictCode(addressData.districtCode || "");
  }, [addressData.districtCode]);

  const handleSelectChange = (
    field: keyof ShippingAddressData,
    code: string,
    name: string,
    type: "province" | "district" | "commune",
  ) => {
    let newAddrData = { ...addressData, [field]: code };
    if (type === "province") {
      newAddrData = {
        ...newAddrData,
        provinceName: name,
        districtCode: "",
        districtName: "",
        communeCode: "",
        communeName: "",
      };
      setCurrentProvinceCode(code);
      setCurrentDistrictCode("");
    } else if (type === "district") {
      newAddrData = {
        ...newAddrData,
        districtName: name,
        communeCode: "",
        communeName: "",
      };
      setCurrentDistrictCode(code);
    } else if (type === "commune") {
      newAddrData = { ...newAddrData, communeName: name };
    }
    onFullDataChange(newAddrData);
  };

  return (
    <div className="mt-4 space-y-4 rounded-md border border-gray-200 bg-white px-4 py-6">
      <div>
        <label htmlFor="fullName" className="form-label">
          Họ và tên người nhận <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          id="fullName"
          value={addressData.fullName || ""}
          onChange={(e) => onDataChange("fullName", e.target.value)}
          className="input-field text-sm md:text-base"
          required
        />
      </div>
      <div>
        <label htmlFor="phone" className="form-label">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={addressData.phone || ""}
          onChange={(e) => onDataChange("phone", e.target.value)}
          className="input-field text-sm md:text-base"
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div>
          <label htmlFor="provinceCode" className="form-label">
            Tỉnh/Thành phố <span className="text-red-500">*</span>
          </label>
          <select
            name="provinceCode"
            id="provinceCode"
            value={addressData.provinceCode || ""}
            onChange={(e) =>
              handleSelectChange(
                "provinceCode",
                e.target.value,
                e.target.options[e.target.selectedIndex].text,
                "province",
              )
            }
            className="input-field text-sm md:text-base"
            required
            disabled={isLoadingProvinces}
          >
            <option value="">
              {isLoadingProvinces ? "Đang tải..." : "-- Chọn Tỉnh/Thành --"}
            </option>
            {provinces?.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="districtCode" className="form-label">
            Quận/Huyện <span className="text-red-500">*</span>
          </label>
          <select
            name="districtCode"
            id="districtCode"
            value={addressData.districtCode || ""}
            onChange={(e) =>
              handleSelectChange(
                "districtCode",
                e.target.value,
                e.target.options[e.target.selectedIndex].text,
                "district",
              )
            }
            className="input-field text-sm md:text-base"
            required
            disabled={!currentProvinceCode || isLoadingDistricts}
          >
            <option value="">
              {isLoadingDistricts && currentProvinceCode
                ? "Đang tải..."
                : "-- Chọn Quận/Huyện --"}
            </option>
            {districts?.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="communeCode" className="form-label">
          Phường/Xã <span className="text-red-500">*</span>
        </label>
        <select
          name="communeCode"
          id="communeCode"
          value={addressData.communeCode || ""}
          onChange={(e) =>
            handleSelectChange(
              "communeCode",
              e.target.value,
              e.target.options[e.target.selectedIndex].text,
              "commune",
            )
          }
          className="input-field text-sm md:text-base"
          required
          disabled={!currentDistrictCode || isLoadingCommunes}
        >
          <option value="">
            {isLoadingCommunes && currentDistrictCode
              ? "Đang tải..."
              : "-- Chọn Phường/Xã --"}
          </option>
          {communes?.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="street" className="form-label">
          Địa chỉ cụ thể (Số nhà, tên đường...){" "}
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="street"
          id="street"
          value={addressData.street || ""}
          onChange={(e) => onDataChange("street", e.target.value)}
          className="input-field text-sm md:text-base"
          required
        />
      </div>
    </div>
  );
};

export default function CheckoutForm({
  user,
  userAddresses,
  isLoadingAddresses,
  paymentMethod,
  setPaymentMethod,
  onSubmitOrder,
  isSubmittingOrder,
  setIsProcessingPayPal,
}: CheckoutFormProps) {
  const isAuthenticated = !!user;
  const [email, setEmail] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [isEditingNewAddress, setIsEditingNewAddress] = useState(
    !isAuthenticated || userAddresses.length === 0,
  );
  const [newAddressData, setNewAddressData] = useState<
    Partial<ShippingAddressData>
  >({});
  const [notes, setNotes] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEditInModal, setAddressToEditInModal] =
    useState<Address | null>(null);

  const queryClient = useQueryClient();

  // Khởi tạo email một lần duy nhất khi component mount
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (isAuthenticated && userAddresses.length > 0) {
      const defaultAddr = userAddresses.find((addr) => addr.isDefault);
      const targetId = defaultAddr?._id || userAddresses[0]?._id || null;
      if (targetId) {
        handleAddressSelect(targetId.toString());
      } else {
        setIsEditingNewAddress(true);
        setSelectedAddressId(null);
      }
    } else {
      setIsEditingNewAddress(true);
      setSelectedAddressId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userAddresses]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    setIsEditingNewAddress(false);
    const selectedAddr = userAddresses.find(
      (addr) => addr._id?.toString() === addressId,
    );
    if (selectedAddr) {
      setNewAddressData({
        fullName: selectedAddr.fullName,
        phone: selectedAddr.phone,
        street: selectedAddr.street,
        communeCode: selectedAddr.communeCode,
        communeName: selectedAddr.communeName,
        districtCode: selectedAddr.districtCode,
        districtName: selectedAddr.districtName,
        provinceCode: selectedAddr.provinceCode,
        provinceName: selectedAddr.provinceName,
      });
    }
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setIsEditingNewAddress(true);
    setNewAddressData({});
  };

  const handleEditSavedAddress = (address: Address) => {
    setAddressToEditInModal(address);
    setIsAddressModalOpen(true);
  };

  const onAddressSavedFromModal = (savedAddress: Address) => {
    queryClient.invalidateQueries({ queryKey: userKeys.addresses() });
    queryClient.invalidateQueries({ queryKey: userKeys.profile() });

    toast.success("Địa chỉ đã được cập nhật.");
    setIsAddressModalOpen(false);
    setAddressToEditInModal(null);
    if (savedAddress._id) {
      setSelectedAddressId(savedAddress._id.toString());
      setIsEditingNewAddress(false);
      setNewAddressData({
        fullName: savedAddress.fullName,
        phone: savedAddress.phone,
        street: savedAddress.street,
        provinceCode: savedAddress.provinceCode,
        provinceName: savedAddress.provinceName,
        districtCode: savedAddress.districtCode,
        districtName: savedAddress.districtName,
        communeCode: savedAddress.communeCode,
        communeName: savedAddress.communeName,
      });
    }
  };

  // Sử dụng useCallback để tránh re-create function
  const handleAddressDataChange = useCallback(
    (field: keyof ShippingAddressData, value: string) => {
      setNewAddressData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleAddressFullDataChange = useCallback(
    (data: Partial<ShippingAddressData>) => {
      setNewAddressData(data);
    },
    [],
  );

  // *** Thu thập và Validate dữ liệu form ***
  const getFormDataForPayPal = (): Omit<
    OrderCreationPayload,
    "selectedCartItemIds"
  > | null => {
    // 1. Xác định object địa chỉ cuối cùng
    let finalShippingAddress: Partial<ShippingAddressData> | null = null;
    if (isAuthenticated && selectedAddressId) {
      finalShippingAddress =
        userAddresses.find(
          (addr) => addr._id?.toString() === selectedAddressId,
        ) || null;
    } else if (isEditingNewAddress || !isAuthenticated) {
      finalShippingAddress = newAddressData;
    }

    // 2. Validate email cho guest
    if (!isAuthenticated && !email.trim()) {
      toast.error("Vui lòng nhập email của bạn để tiếp tục.");
      return null; // Trả về null nếu không hợp lệ
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isAuthenticated && email.trim() && !emailRegex.test(email)) {
      toast.error("Địa chỉ email không hợp lệ.");
      return null;
    }

    // 3. Validate object địa chỉ cuối cùng
    if (
      !finalShippingAddress ||
      !finalShippingAddress.fullName?.trim() ||
      !finalShippingAddress.phone?.trim() ||
      !finalShippingAddress.street?.trim() ||
      !finalShippingAddress.provinceCode ||
      !finalShippingAddress.districtCode ||
      !finalShippingAddress.communeCode
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ giao hàng.");
      return null;
    }

    // 4. Nếu mọi thứ hợp lệ, trả về object payload
    return {
      shippingAddress: finalShippingAddress as ShippingAddressData,
      paymentMethod,
      notes,
      email: isAuthenticated ? undefined : email,
    };
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrder || paymentMethod === "PAYPAL") {
      return;
    }

    // Tái sử dụng hàm getFormData để lấy và validate dữ liệu
    const formData = getFormDataForPayPal();

    // Nếu formData là null, có nghĩa là có lỗi validation và toast đã được hiển thị
    if (formData) {
      onSubmitOrder(formData);
    }
  };

  return (
    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
      {/* Phần Email cho Guest */}
      {!isAuthenticated && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-900">
            Thông tin liên hệ
          </h2>
          <div>
            <label
              htmlFor="email-checkout"
              className="block text-base font-medium text-gray-700"
            >
              Địa chỉ Email <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <input
                type="email"
                name="email"
                id="email-checkout"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field w-full bg-white text-sm md:text-base"
                placeholder="you@example.com"
              />
            </div>
          </div>
        </section>
      )}

      {/* Phần Địa chỉ giao hàng */}
      <section>
        <h2 className="mb-3 text-lg font-medium text-gray-900">
          Địa chỉ giao hàng
        </h2>
        {isLoadingAddresses && isAuthenticated && (
          <div className="mb-6 space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse space-y-2 rounded bg-gray-200 p-4"
              >
                <div className="h-4 w-3/4 rounded bg-gray-300"></div>
                <div className="h-3 w-full rounded bg-gray-300"></div>
              </div>
            ))}
          </div>
        )}
        {isAuthenticated && userAddresses.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="space-y-3">
              {userAddresses.map((address) => (
                <div
                  key={address._id!.toString()}
                  className={classNames(
                    "relative block cursor-pointer rounded-lg border bg-white px-5 py-4 shadow-sm focus:outline-none",
                    selectedAddressId === address._id!.toString()
                      ? "border-indigo-600 ring-2 ring-indigo-500"
                      : "border-gray-300 hover:border-gray-400",
                  )}
                  onClick={() => handleAddressSelect(address._id!.toString())}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {address.fullName} - {address.phone}
                        {address.isDefault && (
                          <span className="ml-2 text-xs text-green-600">
                            (Mặc định)
                          </span>
                        )}
                      </p>
                      <div className="text-gray-500">
                        <p className="mt-1">
                          {address.street}, {address.communeName},{" "}
                          {address.districtName}, {address.provinceName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedAddressId === address._id!.toString() && (
                        <FiCheck className="h-5 w-5 text-indigo-600" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditSavedAddress(address);
                        }}
                        className="p-1 text-xs text-indigo-600 hover:text-indigo-800"
                        aria-label={`Sửa địa chỉ của ${address.fullName}`}
                      >
                        <FiEdit3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleUseNewAddress}
              className={classNames(
                "mt-4 flex items-center text-sm font-medium",
                isEditingNewAddress
                  ? "cursor-default text-gray-500"
                  : "text-indigo-600 hover:text-indigo-500",
              )}
              disabled={isEditingNewAddress}
            >
              <FiPlusCircle className="mr-2 h-5 w-5" />
              Nhập địa chỉ mới
            </button>
          </div>
        )}

        {(isEditingNewAddress || !isAuthenticated) && (
          <>
            {isAuthenticated && userAddresses.length > 0 && (
              <p className="mb-4 text-sm text-gray-500">
                Hoặc nhập địa chỉ mới dưới đây:
              </p>
            )}
            <AddressInputFields
              addressData={newAddressData}
              onDataChange={handleAddressDataChange}
              onFullDataChange={handleAddressFullDataChange}
            />
          </>
        )}
      </section>

      {/* Phần Phương thức thanh toán */}
      <section>
        <h2 className="mb-3 text-lg font-medium text-gray-900">
          Phương thức thanh toán
        </h2>
        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => {
            const IconComponent = method.icon;
            return (
              <div
                key={method.id}
                className={classNames(
                  "relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none",
                  paymentMethod === method.id
                    ? "border-indigo-600 ring-2 ring-indigo-500"
                    : "border-gray-300 hover:border-gray-400",
                )}
                onClick={() => setPaymentMethod(method.id)}
              >
                <div className="flex flex-1 items-center">
                  <div className="mr-3 flex h-8 w-8 items-center justify-center">
                    <IconComponent
                      className={classNames(
                        "h-6 w-6",
                        method.id === "PAYPAL"
                          ? "text-blue-600"
                          : "text-gray-600",
                      )}
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="block text-sm font-medium text-gray-900">
                      {method.name}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">
                      {method.description}
                    </span>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="sr-only">{method.name}</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        {/* HIỂN THỊ NÚT PAYPAL HOẶC NÚT ĐẶT HÀNG THÔNG THƯỜNG */}
        {paymentMethod === "PAYPAL" ? (
          <div className="mx-auto mt-8">
            <PayPalButtonsWrapper
              getFormData={getFormDataForPayPal}
              setIsProcessing={setIsProcessingPayPal}
            />
          </div>
        ) : (
          <div className="hidden pt-4">
            {/* Ẩn nút submit mặc định, việc submit sẽ được trigger từ summary */}
            <button type="submit" disabled={isSubmittingOrder}>
              {isSubmittingOrder ? "Đang xử lý..." : "Hoàn tất đặt hàng"}
            </button>
          </div>
        )}
      </section>

      {/* Phần Ghi chú */}
      <section>
        <h2 className="mb-2 text-lg font-medium text-gray-900">
          Ghi chú đơn hàng
        </h2>
        <div className="bg-white">
          <label htmlFor="order-notes" className="sr-only">
            Ghi chú
          </label>
          <textarea
            id="order-notes"
            name="order-notes"
            rows={3}
            className="input-field h-30 w-full resize-none text-sm focus:outline-none md:text-base"
            placeholder="Thêm ghi chú cho đơn hàng của bạn (tùy chọn)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </section>

      {/* <div className="pt-4">
        <button
          type="submit"
          onClick={(e) => {
            if (
              isSubmittingOrder ||
              (!selectedAddressId && !newAddressData.communeCode)
            ) {
              e.preventDefault();
            }
          }}
          disabled={
            isSubmittingOrder ||
            (!selectedAddressId && !newAddressData.communeCode)
          }
          className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {isSubmittingOrder && (
            <FiLoader className="mr-3 -ml-1 h-5 w-5 animate-spin text-white" />
          )}
          {isSubmittingOrder ? "Đang xử lý..." : "Hoàn tất đặt hàng"}
        </button>
      </div> */}

      {/* Modal chỉ dùng để SỬA địa chỉ đã lưu */}
      {isAuthenticated && isAddressModalOpen && (
        <AddressFormModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          addressToEdit={addressToEditInModal}
          onAddressSaved={onAddressSavedFromModal}
        />
      )}
    </form>
  );
}
