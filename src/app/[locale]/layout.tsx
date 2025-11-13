import {NextIntlClientProvider} from "next-intl";
import type {Metadata} from "next";
import {notFound} from "next/navigation";

import {routing} from "@/i18n";
import type {AppLocale} from "@/i18n";
import { env } from "@/lib/env";
import { PWAProvider } from "@/components/pwa/pwa-provider";

async function loadMessages(locale: AppLocale) {
  try {
    return (await import(`@/i18n/messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}`, error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as AppLocale) 
    ? rawLocale 
    : routing.defaultLocale) as AppLocale;
  const messages = await loadMessages(locale);
  
  if (!messages?.metadata) {
    return {
      metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
      title: {
        default: "Social — Nightlife, Connected",
        template: "%s | Social",
      },
      description: "Social is the discreet nightlife companion for venues and their guests.",
      applicationName: "Social",
    };
  }

  const t = messages.metadata;
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    title: {
      default: t.defaultTitle,
      template: t.titleTemplate,
    },
    description: t.description,
    applicationName: t.applicationName,
    appleWebApp: {
      statusBarStyle: t.appleStatusBarStyle as "default" | "black" | "black-translucent" | undefined,
      title: t.appleTitle,
    },
    manifest: "/manifest.webmanifest",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale = (routing.locales.includes(rawLocale as AppLocale) 
    ? rawLocale 
    : routing.defaultLocale) as AppLocale;

  const messages = await loadMessages(locale);
  
  if (!messages) {
    console.error(`Failed to load messages for locale ${locale}`);
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PWAProvider>{children}</PWAProvider>
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
