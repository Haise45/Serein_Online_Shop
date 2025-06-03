"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { FiLoader } from "react-icons/fi";
import { useUpdateUserProfile } from "@/lib/react-query/userQueries";
import { UpdateUserProfilePayload } from "@/types/user";
import PasswordInput from "./PasswordInput";

const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const updateProfileMutation = useUpdateUserProfile();

  const handleSubmitPassword = (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    const payload: UpdateUserProfilePayload = {
      currentPassword: currentPassword,
      password: newPassword,
    };

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrent(false); // Reset visibility
        setShowNew(false);
        setShowConfirm(false);
        toast.success("Đổi mật khẩu thành công!");
      },
      // onError đã được xử lý trong hook useUpdateUserProfile
    });
  };

  return (
    <form onSubmit={handleSubmitPassword} className="space-y-6">
      <PasswordInput
        id="current-password"
        label="Mật khẩu hiện tại"
        value={currentPassword}
        onChange={setCurrentPassword}
        show={showCurrent}
        onToggleShow={() => setShowCurrent(!showCurrent)}
      />
      <PasswordInput
        id="new-password"
        label="Mật khẩu mới"
        value={newPassword}
        onChange={setNewPassword}
        show={showNew}
        onToggleShow={() => setShowNew(!showNew)}
      />
      <PasswordInput
        id="confirm-password"
        label="Xác nhận mật khẩu mới"
        value={confirmPassword}
        onChange={setConfirmPassword}
        show={showConfirm}
        onToggleShow={() => setShowConfirm(!showConfirm)}
      />
      <button
        type="submit"
        className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-70 sm:w-auto"
        disabled={updateProfileMutation.isPending}
      >
        {updateProfileMutation.isPending && (
          <FiLoader className="mr-2 -ml-1 h-4 w-4 animate-spin" />
        )}
        Đổi mật khẩu
      </button>
    </form>
  );
};

export default ChangePasswordForm;
