import PageHeader from "@/components/shared/PageHeader";
import AdminUsersClient from "./AdminUsersClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminUsers.meta" });

  return {
    title: t("listTitle"),
  };
}

export default async function AdminUsersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminUsers.listPageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminUsersClient />
    </div>
  );
}
