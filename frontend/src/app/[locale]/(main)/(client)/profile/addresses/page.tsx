import type { Metadata } from "next";
import UserAddressesClient from "./UserAddressesClient";
import PageHeader from "@/components/shared/PageHeader";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.addresses" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function UserAddressesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AddressPage" });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <UserAddressesClient />
    </div>
  );
}
