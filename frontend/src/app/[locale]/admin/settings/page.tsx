import PageHeader from "@/components/shared/PageHeader";
import AdminSettingsClient from "./AdminSettingsClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminSettings.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AdminSettingsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminSettings.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminSettingsClient />
    </div>
  );
}
