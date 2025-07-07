import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import { getTranslations } from "next-intl/server";
import ForgotPasswordPageClient from "./ForgotPasswordPageClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Metadata.forgotPassword",
  });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ForgotPasswordPageContainer({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Breadcrumbs" });
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t("login"), href: "/login" },
    { label: t("forgotPassword"), isCurrent: true },
  ];
  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <ForgotPasswordPageClient />
    </div>
  );
}
