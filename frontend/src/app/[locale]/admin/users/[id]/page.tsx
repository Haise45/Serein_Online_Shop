import PageHeader from "@/components/shared/PageHeader";
import AdminUserDetailClient from "./AdminUserDetailClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminUsers.meta" });

  return {
    title: t("detailTitle"),
  };
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "AdminUsers.detailPageHeader" });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminUserDetailClient userId={id} />
    </div>
  );
}
