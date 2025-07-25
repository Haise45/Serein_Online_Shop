import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminProductsClient from "./AdminProductsClient";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminProducts.meta" });

  return {
    title: t("title"),
  };
}

export default async function AdminProductsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminProducts.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminProductsClient />
    </div>
  );
}
