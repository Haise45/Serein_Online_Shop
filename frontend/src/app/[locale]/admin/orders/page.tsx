import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AdminOrdersClient from "./AdminOrdersClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminOrders.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AdminOrdersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminOrders.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminOrdersClient />
    </div>
  );
}
