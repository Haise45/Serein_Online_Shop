import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { BreadcrumbItem } from "@/types";
import { PageSearchParams } from "@/types/next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import ProductsPageClient from "./ProductsPageClient";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<PageSearchParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.products" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ProductsPageContainer({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Breadcrumbs" });

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t("home"), href: "/" },
    { label: t("products"), isCurrent: true },
  ];

  const sp = await searchParams;

  return (
    <div className="mx-auto px-0 lg:px-10">
      <div className="mb-4 sm:mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <Suspense fallback={<ProductsPageLoadingSkeleton />}>
        <ProductsPageClient searchParams={sp} />
      </Suspense>
    </div>
  );
}

function ProductsPageLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-12">
      {/* Skeleton cho Filter Sidebar */}
      <div className="hidden lg:col-span-3 lg:block">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-3 h-6 w-3/4 rounded bg-gray-200"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 w-full rounded bg-gray-200"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Skeleton cho Product Grid */}
      <div className="lg:col-span-9">
        <div className="mb-6 flex justify-end">
          <div className="h-10 w-48 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white"
            >
              <div className="aspect-square w-full rounded-t-xl bg-gray-300"></div>
              <div className="p-3 sm:p-4">
                <div className="mb-2 h-5 w-3/4 rounded bg-gray-300"></div>
                <div className="h-4 w-full rounded bg-gray-300 sm:h-5"></div>
                <div className="mt-2 h-6 w-1/2 rounded bg-gray-300"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <div className="h-10 w-64 animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}
