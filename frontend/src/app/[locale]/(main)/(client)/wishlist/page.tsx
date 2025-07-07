import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import { getTranslations } from "next-intl/server";
import WishlistPageClient from "./WishlistPageClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.wishlist" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function WishlistPageContainer({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Breadcrumbs" });

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t("home"), href: "/" },
    { label: t("wishlist"), isCurrent: true },
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <Breadcrumbs items={breadcrumbItems} />
      <WishlistPageClient />
    </div>
  );
}
