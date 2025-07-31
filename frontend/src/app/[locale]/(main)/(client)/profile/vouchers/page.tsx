import PageHeader from "@/components/shared/PageHeader";
import type { Metadata } from "next";
import { Suspense } from "react";
import UserVouchersClient from "./UserVouchersClient";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.vouchers" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

function VouchersLoadingSkeleton() {
  return (
    <div className="mt-6 grid animate-pulse grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border-l-4 border-indigo-400 bg-white p-5 shadow-lg"
        >
          <div className="mb-2 h-6 w-1/2 rounded bg-gray-300"></div>
          <div className="mb-1 h-4 w-full rounded bg-gray-200"></div>
          <div className="mb-3 h-4 w-3/4 rounded bg-gray-200"></div>
          <div className="mb-1 h-3 w-1/3 rounded bg-gray-200"></div>
          <div className="h-3 w-1/2 rounded bg-gray-200"></div>
          <div className="mt-4 ml-auto h-8 w-24 rounded bg-gray-300"></div>
        </div>
      ))}
    </div>
  );
}

export default async function UserVouchersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "VoucherPage" });

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <Suspense fallback={<VouchersLoadingSkeleton />}>
        <UserVouchersClient />
      </Suspense>
    </div>
  );
}
