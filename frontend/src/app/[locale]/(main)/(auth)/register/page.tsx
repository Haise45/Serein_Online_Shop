import Breadcrumbs from "@/components/shared/Breadcrumbs";
import RegisterPageClient from "./RegisterPageClient";
import { BreadcrumbItem } from "@/types";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.register" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RegisterPageContainer({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Breadcrumbs" });

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: t("register"),
      isCurrent: true,
    },
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <RegisterPageClient />
    </div>
  );
}
