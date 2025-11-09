import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import type { Metadata } from "next";

import { env } from "@/lib/env";
import { PWAProvider } from "@/components/pwa/pwa-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "Social — Nightlife, Connected",
    template: "%s | Social",
  },
  description:
    "Social is the discreet nightlife companion for venues and their guests. Connect, match, and manage the crowd from a single progressive web experience.",
  applicationName: "Social",
  appleWebApp: {
    statusBarStyle: "black-translucent",
    title: "Social",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <PWAProvider>{children}</PWAProvider>
      </body>
    </html>
  );
}
