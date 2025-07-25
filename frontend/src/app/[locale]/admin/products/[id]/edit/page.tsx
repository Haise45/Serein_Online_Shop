import PageHeader from "@/components/shared/PageHeader";
import AdminProductEditClient from "./AdminProductEditClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminProductForm.meta",
  });

  return {
    title: t("editTitle"),
  };
}

export default async function AdminProductEditPage({ params }: Props) {
  const { id, locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminProductForm.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("editTitle")} description={t("editDescription")} />
      <AdminProductEditClient productId={id} />
    </div>
  );
}
