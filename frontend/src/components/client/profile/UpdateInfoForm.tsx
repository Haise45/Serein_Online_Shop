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
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("UpdateInfoForm");

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
      toast.error(t("nameRequiredError"));
      return;
    }
    if (
      phone.trim() &&
      !/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/.test(
        phone.trim(),
      )
    ) {
      toast.error(t("invalidPhoneError"));
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(t("invalidEmailError"));
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
      toast(t("noChangesToast"));
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
          toast(t("emailVerificationNotice"), {
            icon: "ℹ️",
            duration: 5000,
          });
          router.push(
            `/verify-email?email=${encodeURIComponent(updatedUserData.email)}&redirect=${encodeURIComponent(pathname)}`,
          );
        } else {
          toast.success(t("updateSuccessToast"));
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
          label={t("nameLabel")}
          value={initialUser.name}
          icon={<FiUser size={14} />}
        />
        <InfoDisplay
          label={t("emailLabel")}
          value={initialUser.email}
          icon={<FiMail size={14} />}
        />
        <InfoDisplay
          label={t("phoneLabel")}
          value={initialUser.phone}
          icon={<FiPhone size={14} />}
        />
        <button
          onClick={() => setIsEditing(true)}
          className="mt-6 inline-flex items-center justify-center rounded-md border border-indigo-600 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
        >
          <FiEdit2 className="mr-2 h-4 w-4" />
          {t("editInfoButton")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmitInfo} className="space-y-6">
      <div>
        <label htmlFor="profile-name-edit" className="form-label">
          {t("nameLabel")} <span className="text-red-500">*</span>
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
          {t("emailLabel")} <span className="text-red-500">*</span>
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
            {t("emailChangeNotice")}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="profile-phone-edit" className="form-label">
          {t("phoneLabel")}
        </label>
        <input
          id="profile-phone-edit"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-field"
          placeholder={t("phonePlaceholder")}
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
          <FiSave className="mr-2 h-4 w-4" /> {t("saveChangesButton")}
        </button>
        <button
          type="button"
          onClick={handleEditToggle}
          className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
          disabled={updateProfileMutation.isPending}
        >
          <FiXCircle className="mr-2 h-4 w-4 text-gray-400" /> {t("cancelButton")}
        </button>
      </div>
    </form>
  );
};

export default UpdateInfoForm;
