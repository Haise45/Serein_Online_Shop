import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import UserProfileSettingsClient from "./UserProfileSettingsClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.profile" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ProfileSettingsPage({ params }: Props) {
  await params; // Nếu không cần `locale`, chỉ để đồng bộ chữ ký hàm
  return <UserProfileSettingsClient />;
}
