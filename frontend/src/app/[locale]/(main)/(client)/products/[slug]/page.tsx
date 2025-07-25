import ProductDetailSkeleton from "@/components/client/product/ProductDetailSkeleton";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { getProductByIdOrSlug } from "@/services/productService";
import { BreadcrumbItem } from "@/types";
import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import ProductDetailsClient from "./ProductDetailsClient";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await getProductByIdOrSlug(slug);
  const t = await getTranslations({ locale, namespace: "Metadata" });

  if (!product) {
    return {
      title: t("productNotFound.title"),
    };
  }

  const imageUrl = product.images?.[0] || (await parent).openGraph?.images?.[0];

  return {
    title: t("product.title", { name: product.name }),
    description:
      product.description?.substring(0, 160) ||
      t("product.description", { name: product.name }),
    openGraph: {
      title: product.name,
      description:
        product.description?.substring(0, 160) ||
        t("product.description", { name: product.name }),
      images: imageUrl ? [imageUrl] : [],
      type: "website",
      siteName: "Serein Shop",
      locale: locale === "vi" ? "vi_VN" : "en_US",
    },
    keywords: product.name,
    other: {
      "product:price:amount": product.price?.toString(),
      "product:price:currency": "VND",
    },
  };
}

export default async function ProductDetailPageContainer({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "Breadcrumbs" });

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t("home"), href: "/" },
    { label: t("products"), href: "/products" },
    { label: t("productDetails"), isCurrent: true },
  ];

  return (
    <div className="mx-auto px-0 lg:px-10">
      <div className="mb-4 sm:mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailsClient slug={slug} />
      </Suspense>
    </div>
  );
}
