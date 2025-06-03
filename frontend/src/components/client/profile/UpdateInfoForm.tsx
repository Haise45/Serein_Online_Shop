"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiLoader,
  FiEdit2,
  FiSave,
  FiXCircle,
  FiUser,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import { useUpdateUserProfile } from "@/lib/react-query/userQueries";
import { UpdateUserProfilePayload, User } from "@/types/user";
import InfoDisplay from "./InfoDisplay";
import { useRouter, usePathname } from "next/navigation";

interface UpdateInfoFormProps {
  initialUser: User;
  onProfileUpdateSuccess: (
    updatedUserFromApi: User,
    emailChangedRequiresVerification: boolean,
  ) => void;
}

const UpdateInfoForm: React.FC<UpdateInfoFormProps> = ({
  initialUser,
  onProfileUpdateSuccess,
}) => {
  const [name, setName] = useState(initialUser.name);
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [email, setEmail] = useState(initialUser.email);
  const [isEditing, setIsEditing] = useState(false);

  const updateProfileMutation = useUpdateUserProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name);
      setPhone(initialUser.phone || "");
      setEmail(initialUser.email);
    }
  }, [initialUser]);

  const handleEditToggle = () => {
    if (isEditing) {
      setName(initialUser.name);
      setPhone(initialUser.phone || "");
      setEmail(initialUser.email);
    }
    setIsEditing(!isEditing);
  };

  const handleSubmitInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập họ và tên.");
      return;
    }
    if (
      phone.trim() &&
      !/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/.test(
        phone.trim(),
      )
    ) {
      toast.error("Số điện thoại không hợp lệ.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Địa chỉ email mới không hợp lệ.");
      return;
    }

    const payload: UpdateUserProfilePayload = {};
    let emailActuallyChanged = false;

    if (name.trim() !== initialUser.name) payload.name = name.trim();
    if (phone.trim() !== (initialUser.phone || ""))
      payload.phone = phone.trim() === "" ? "" : phone.trim(); // Xử lý xóa SĐT
    if (email.trim().toLowerCase() !== initialUser.email.toLowerCase()) {
      payload.email = email.trim().toLowerCase();
      emailActuallyChanged = true;
    }

    if (Object.keys(payload).length === 0) {
      toast("Không có thông tin nào thay đổi.");
      setIsEditing(false);
      return;
    }

    updateProfileMutation.mutate(payload, {
      onSuccess: (updatedUserData) => {
        const emailChangedAndRequiresVerification =
          emailActuallyChanged &&
          !updatedUserData.isEmailVerified && // API trả về isEmailVerified cho email mới
          updatedUserData.email === payload.email; // Đảm bảo email mới được áp dụng

        onProfileUpdateSuccess(
          updatedUserData as User,
          emailChangedAndRequiresVerification,
        );

        if (emailChangedAndRequiresVerification) {
          toast(
            "Thông tin đã cập nhật. Email của bạn đã thay đổi, vui lòng xác thực email mới.",
            {
              icon: "ℹ️",
              duration: 5000,
            },
          );
          router.push(
            `/verify-email?email=${encodeURIComponent(updatedUserData.email)}&redirect=${encodeURIComponent(pathname)}`,
          );
        } else {
          toast.success("Thông tin cá nhân đã được cập nhật!");
        }
        setIsEditing(false);
      },
      // onError đã được xử lý trong hook useUpdateUserProfile
    });
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <InfoDisplay
          label="Họ và tên"
          value={initialUser.name}
          icon={<FiUser size={14} />}
        />
        <InfoDisplay
          label="Email"
          value={initialUser.email}
          icon={<FiMail size={14} />}
        />
        <InfoDisplay
          label="Số điện thoại"
          value={initialUser.phone}
          icon={<FiPhone size={14} />}
        />
        <button
          onClick={() => setIsEditing(true)}
          className="mt-6 inline-flex items-center justify-center rounded-md border border-indigo-600 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          <FiEdit2 className="mr-2 h-4 w-4" />
          Chỉnh sửa thông tin
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitInfo} className="space-y-6">
      <div>
        <label htmlFor="profile-name-edit" className="form-label">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          id="profile-name-edit"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          required
        />
      </div>
      <div>
        <label htmlFor="profile-email-edit" className="form-label">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="profile-email-edit"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          required
        />
        {email.trim().toLowerCase() !== initialUser.email.toLowerCase() && (
          <p className="mt-1 text-xs text-orange-600">
            Thay đổi email sẽ yêu cầu bạn xác thực lại địa chỉ email mới.
          </p>
        )}
      </div>
      <div>
        <label htmlFor="profile-phone-edit" className="form-label">
          Số điện thoại
        </label>
        <input
          id="profile-phone-edit"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-field"
          placeholder="Để trống nếu muốn xóa"
        />
      </div>
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-70 sm:w-auto"
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending && (
            <FiLoader className="mr-2 -ml-1 h-4 w-4 animate-spin" />
          )}
          <FiSave className="mr-2 h-4 w-4" /> Lưu thay đổi
        </button>
        <button
          type="button"
          onClick={handleEditToggle}
          className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
          disabled={updateProfileMutation.isPending}
        >
          <FiXCircle className="mr-2 h-4 w-4 text-gray-400" /> Hủy
        </button>
      </div>
    </form>
  );
};

export default UpdateInfoForm;
