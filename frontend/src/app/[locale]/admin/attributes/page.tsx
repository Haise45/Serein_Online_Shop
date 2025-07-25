import PageHeader from "@/components/shared/PageHeader";
import AdminAttributesClient from "./AdminAttributesClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminAttributes.meta",
  });

  return {
    title: t("title"),
  };
}

export default async function AdminAttributesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminAttributes.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminAttributesClient />
    </div>
  );
}
