import PageHeader from "@/components/shared/PageHeader";
import AdminOrderDetailClient from "./AdminOrderDetailClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminOrderDetail.meta",
  });

  const shortId = id.slice(-6).toUpperCase();

  return {
    title: t("title", { id: shortId }),
    description: t("description", { id: shortId }),
  };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({
    locale,
    namespace: "AdminOrderDetail.pageHeader",
  });

  const shortId = id.slice(-6).toUpperCase();

  return (
    <div>
      <PageHeader
        title={t("title", { id: shortId })}
        description={t("description")}
      />
      <AdminOrderDetailClient orderId={id} />
    </div>
  );
}
