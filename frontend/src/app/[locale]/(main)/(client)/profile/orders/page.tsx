import PageHeader from "@/components/shared/PageHeader";
import { PageSearchParams } from "@/types/next";
import type { Metadata } from "next";
import { Suspense } from "react";
import UserOrdersClient from "./UserOrdersClient";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<PageSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.orders" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

function OrdersLoadingSkeleton() {
  return (
    <div className="mt-6 animate-pulse space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg bg-white p-4 shadow-md sm:p-6">
          <div className="mb-3 flex flex-col items-start justify-between sm:flex-row sm:items-center">
            <div className="mb-2 space-y-1 sm:mb-0">
              <div className="h-5 w-32 rounded bg-gray-300"></div>
              <div className="h-4 w-40 rounded bg-gray-200"></div>
            </div>
            <div className="h-6 w-24 rounded bg-gray-300"></div>
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="h-10 w-full rounded bg-gray-200"></div>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="h-8 w-28 rounded bg-gray-300"></div>
          </div>
        </div>
      ))}
      <div className="mt-8 flex justify-center">
        <div className="h-10 w-64 rounded bg-gray-200"></div>
      </div>
    </div>
  );
}

export default async function UserOrdersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "OrderListPage" });
  const resolvedSearchParams = await searchParams;

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <Suspense fallback={<OrdersLoadingSkeleton />}>
        <UserOrdersClient searchParams={resolvedSearchParams} />
      </Suspense>
    </div>
  );
}
