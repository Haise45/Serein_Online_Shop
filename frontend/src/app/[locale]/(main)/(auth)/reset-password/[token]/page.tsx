import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import { getTranslations } from "next-intl/server";
import ResetPasswordPageClient from "./ResetPasswordPageClient";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Metadata.resetPassword",
  });

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: true,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default async function ResetPasswordPageContainer({ params }: Props) {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: "Breadcrumbs" });

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t("login"), href: "/login" },
    { label: t("resetPassword"), isCurrent: true },
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <ResetPasswordPageClient token={token} />
    </div>
  );
}
