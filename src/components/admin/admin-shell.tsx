"use client";

import {usePathname, useSearchParams} from "next/navigation";
import {useMemo} from "react";
import {useTranslations} from "next-intl";
import Image from "next/image";

import {Link} from "@/i18n";
import {LanguageToggle} from "@/components/global/language-toggle";
import {cn} from "@/lib/utils";
import {SocialWordmark} from "@/components/brand/social-wordmark";

type Venue = {
  id: string;
  name: string;
  slug: string | null;
};

export function AdminShell({
  children,
  userEmail,
  venues,
  profileAvatar,
  profileName,
}: {
  children: React.ReactNode;
  userEmail: string;
  venues: Venue[];
  profileAvatar?: string | null;
  profileName?: string | null;
}) {
  const rawPathname = usePathname();
  const pathname = (() => {
    const normalized = rawPathname.replace(/^\/[a-zA-Z-]+/, "") || "/";
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  })();
  const searchParams = useSearchParams();
  const tNav = useTranslations("adminShell.nav");
  const tAdmin = useTranslations("adminShell");
  const tCommonActions = useTranslations("common.actions");
  const tCommonLabels = useTranslations("common.labels");

  const activeVenueId = useMemo(() => {
    const fromQuery = searchParams.get("venue");
    if (fromQuery && venues.some((venue) => venue.id === fromQuery)) {
      return fromQuery;
    }
    return venues[0]?.id ?? "";
  }, [searchParams, venues]);

  const navItems = [
    { href: "/admin", label: tNav("dashboard") },
    { href: "/admin/users", label: tNav("guests") },
    { href: "/admin/requests", label: tNav("songQueue") },
    { href: "/admin/offers", label: tNav("offers") },
    { href: "/admin/settings", label: tNav("settings") },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-[#1d2946] bg-[var(--surface)]/80 px-6 py-5 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <SocialWordmark className="tracking-[0.6em]" />
            <div className="border-l border-[#1d2946] pl-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                {tCommonLabels("adminRole")}
              </p>
              <h1 className="text-xl font-semibold">{tAdmin("title")}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] sm:justify-end">
            <span>{userEmail}</span>
            {venues.length ? (
              <span>
                {tCommonLabels("venue")}:{" "}
                <span className="text-white">
                  {venues.find((venue) => venue.id === activeVenueId)?.name ?? venues[0].name}
                </span>
              </span>
            ) : null}
            <LanguageToggle className="ml-auto sm:ml-0" />
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full border border-[#4336f3] bg-[#4336f3]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-[#5448ff] hover:bg-[#4336f3]/20"
            >
              <span>👤</span>
              {tAdmin("goToApp")}
            </Link>
            <div className="relative flex items-center gap-2">
              {profileAvatar ? (
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[#223253]">
                  <Image
                    src={profileAvatar}
                    alt={profileName ?? userEmail}
                    fill
                    className="object-cover"
                    sizes="32px"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : profileName ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#223253] bg-[#0d162a] text-xs font-semibold text-white">
                  {profileName.slice(0, 1).toUpperCase()}
                </div>
              ) : null}
            </div>
            <Link
              href="/admin/sign-out"
              className="inline-flex items-center gap-2 rounded-full border border-[#223253] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-white"
            >
              {tCommonActions("signOut")}
            </Link>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={`${item.href}?venue=${activeVenueId}`}
                className={cn(
                  "rounded-2xl px-3 py-2 transition",
                  isActive ? "bg-[var(--surface-muted)] text-white" : "hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}

