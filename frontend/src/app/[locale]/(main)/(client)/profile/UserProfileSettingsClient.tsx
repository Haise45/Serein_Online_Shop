"use client";

import ChangePasswordForm from "@/components/client/profile/ChangePasswordForm";
import UpdateInfoForm from "@/components/client/profile/UpdateInfoForm";
import PageHeader from "@/components/shared/PageHeader";
import { useGetUserProfile, userKeys } from "@/lib/react-query/userQueries";
import { AppDispatch, RootState } from "@/store";
import { loginSuccess } from "@/store/slices/authSlice";
import { User } from "@/types/user";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiLoader } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useTranslations } from "next-intl";

export default function UserProfileSettingsClient() {
  const t = useTranslations("ProfileSettingsPage");
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const {
    isAuthenticated,
    isLoading: authLoading,
    accessToken: currentAccessTokenFromAuth,
  } = useSelector((state: RootState) => state.auth);

  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    error,
  } = useGetUserProfile({
    enabled: isAuthenticated && !authLoading, // Chỉ fetch khi đã authenticated và auth không loading
  });

  const handleProfileUpdateSuccess = (
    updatedUserFromApi: User,
    emailChangedRequiresVerification: boolean,
  ) => {
    if (typeof currentAccessTokenFromAuth === "string") {
      dispatch(
        loginSuccess({
          user: updatedUserFromApi,
          accessToken: currentAccessTokenFromAuth,
        }),
      );
    } else {
      // Trường hợp này không nên xảy ra nếu user đã authenticated
      toast.error(t("tokenError"));
    }
    // Chỉ invalidate query nếu email không thay đổi hoặc đã xác thực
    // Nếu email thay đổi và cần xác thực, người dùng sẽ được redirect,
    // query sẽ được fetch lại khi họ quay lại trang profile sau khi xác thực.
    if (!emailChangedRequiresVerification) {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    }
  };

  if (authLoading || (isAuthenticated && isLoadingProfile)) {
    return (
      <div className="flex min-h-[300px] items-center justify-center py-20">
        <FiLoader className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // ProfileLayout sẽ xử lý điều hướng, nhưng có thể hiển thị thông báo
    return (
      <div className="py-10 text-center text-gray-600">
        {t("loginPrompt")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-red-500">
        {t("loadingError", { error: error.message })}
      </div>
    );
  }

  if (!userProfile) {
    // Trường hợp user đã authenticated nhưng không có userProfile (hiếm)
    return (
      <div className="py-10 text-center text-gray-600">
        {t("loadingProfileError")}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-lg sm:p-8">
        <h2 className="mb-6 border-b border-gray-300 pb-3 text-xl font-semibold text-gray-800">
          {t("personalInfoSectionTitle")}
        </h2>
        <UpdateInfoForm
          initialUser={userProfile} // userProfile đã được check là không null
          onProfileUpdateSuccess={handleProfileUpdateSuccess}
        />
      </div>

      <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-lg sm:p-8">
        <h2 className="mb-6 border-b border-gray-300 pb-3 text-xl font-semibold text-gray-800">
          {t("personalInfoSectionTitle")}
        </h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
