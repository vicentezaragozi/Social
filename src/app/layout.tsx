import "./globals.css";

import {Geist, Geist_Mono} from "next/font/google";
import type {ReactNode} from "react";
import type { Metadata } from "next";

import {routing} from "@/i18n";
import type {AppLocale} from "@/i18n";

import {cookies} from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icons/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  let locale: AppLocale = routing.defaultLocale;
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get?.("NEXT_LOCALE")?.value;
    if (cookieLocale && routing.locales.includes(cookieLocale as AppLocale)) {
      locale = cookieLocale as AppLocale;
    }
  } catch {
    // Ignore cookie access issues and fall back to default locale
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

