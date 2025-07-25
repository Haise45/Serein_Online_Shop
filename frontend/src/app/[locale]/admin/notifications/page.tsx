import PageHeader from "@/components/shared/PageHeader";
import AdminNotificationsClient from "./AdminNotificationsClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminNotifications.meta",
  });

  return {
    title: t("title"),
  };
}

export default async function AdminNotificationsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminNotifications.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminNotificationsClient />
    </div>
  );
}
