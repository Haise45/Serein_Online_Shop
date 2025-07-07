import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import { getTranslations } from "next-intl/server";
import LoginPageClient from "./LoginPageClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.login" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LoginPageContainer({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Breadcrumbs" });
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t("login"), isCurrent: true },
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <LoginPageClient />
    </div>
  );
}
