import PageHeader from "@/components/shared/PageHeader";
import { Metadata } from "next";
import AdminCategoriesClient from "./AdminCategoriesClient";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminCategories.meta",
  });

  return {
    title: t("title"),
  };
}

export default async function AdminCategoriesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminCategories.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminCategoriesClient />
    </div>
  );
}
