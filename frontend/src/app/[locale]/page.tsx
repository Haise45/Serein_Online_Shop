import HomePageClient from "./HomePageClient";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.root" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function HomePage() {
  return <HomePageClient />;
}
