import AddedToCartPopupManager from "@/components/client/cart/AddedToCartPopupManager";
import { ReduxProvider } from "@/store/Provider";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Toaster } from "react-hot-toast";
import AppLoadingManager from "../AppLoadingManager";
import QueryProvider from "../QueryProvider";
import { SettingsProvider } from "../SettingsContext";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.root" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Cung cấp các message cho Client Components
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ReduxProvider>
        <QueryProvider>
          <SettingsProvider>
            <div>
              <Toaster position="top-right" reverseOrder={false} />
            </div>
            <AppLoadingManager>
              {children}
              <AddedToCartPopupManager />
            </AppLoadingManager>
          </SettingsProvider>
        </QueryProvider>
      </ReduxProvider>
    </NextIntlClientProvider>
  );
}
