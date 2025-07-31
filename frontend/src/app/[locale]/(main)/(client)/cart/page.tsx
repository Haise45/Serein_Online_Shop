import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import { getTranslations } from "next-intl/server";
import CartPageClient from "./CartPageClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.cart" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CartPageContainer({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Breadcrumbs" });

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t("home"), href: "/" },
    { label: t("cart"), isCurrent: true },
  ];

  return (
    <div className="bg-gray-100">
      <div className="mx-auto px-0 lg:px-10">
        <Breadcrumbs items={breadcrumbItems} />
        <CartPageClient />
      </div>
    </div>
  );
}
