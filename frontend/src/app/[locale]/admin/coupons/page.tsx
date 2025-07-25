import PageHeader from "@/components/shared/PageHeader";
import AdminCouponsClient from "./AdminCouponsClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AdminCoupons.meta" });

  return {
    title: t("title"),
  };
}

export default async function AdminCouponsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminCoupons.pageHeader",
  });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <AdminCouponsClient />
    </div>
  );
}
