import PageHeader from "@/components/shared/PageHeader";
import AdminProductCreateClient from "./AdminProductCreateClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminProductForm.meta",
  });

  return {
    title: t("createTitle"),
  };
}

export default async function AdminCreateProductPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminProductForm.pageHeader",
  });

  return (
    <div>
      <PageHeader
        title={t("createTitle")}
        description={t("createDescription")}
      />
      <AdminProductCreateClient />
    </div>
  );
}
