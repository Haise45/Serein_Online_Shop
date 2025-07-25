import PageHeader from "@/components/shared/PageHeader";
import AdminReviewsClient from "./AdminReviewsClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminReviews.meta" });

  return {
    title: t("title"),
  };
}

export default async function AdminReviewsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminReviews.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminReviewsClient />
    </div>
  );
}
