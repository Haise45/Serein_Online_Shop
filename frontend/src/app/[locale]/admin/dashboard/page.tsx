import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminDashboardClient from "./AdminDashboardClient";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminDashboard.meta" });

  return {
    title: t("title"),
  };
}

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminDashboard.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminDashboardClient />
    </div>
  );
}
