"use client";

import {usePathname} from "next/navigation";
import {useTranslations} from "next-intl";

import {Link} from "@/i18n";
import { SocialWordmark } from "@/components/brand/social-wordmark";
import {LanguageToggle} from "@/components/global/language-toggle";
import { cn } from "@/lib/utils";

export function AppShell({ 
  children,
  currentUserAvatar,
  currentUserName,
}: { 
  children: React.ReactNode;
  currentUserAvatar: string | null;
  currentUserName: string;
}) {
  const rawPathname = usePathname();
  const pathname = (() => {
    const normalized = rawPathname.replace(/^\/[a-zA-Z-]+/, "") || "/";
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  })();
  const tNav = useTranslations("appShell.nav");
  const tActions = useTranslations("common.actions");
  const tAria = useTranslations("common.aria");

  const navItems: Array<{
    href: string;
    label: string;
    icon: string;
  }> = [
    { href: "/app", label: tNav("connect"), icon: "❤️" },
    { href: "/matches", label: tNav("matches"), icon: "✨" },
    { href: "/requests", label: tNav("requests"), icon: "🎵" },
    { href: "/offers", label: tNav("offers"), icon: "🎁" },
    { href: "/profile", label: tNav("profile"), icon: "👤" },
  ];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#040918] text-white">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[rgba(10,16,36,0.9)] px-4 py-4 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <SocialWordmark asLink className="tracking-[0.6em]" />
          <nav className="hidden items-center gap-1 text-[11px] font-medium uppercase tracking-[0.25em] text-[#8690bf] md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 transition",
                    isActive
                      ? "bg-white/10 text-white shadow-[0_18px_35px_-24px_rgba(122,75,255,0.7)]"
                      : "hover:text-white",
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageToggle className="hidden md:flex" />
            <LanguageToggle className="md:hidden px-2" />
            <Link
              href="/sign-out"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-base font-semibold text-[#9db3ff] transition hover:border-white/30 hover:bg-white/10 md:hidden"
              aria-label={tAria("signOut")}
            >
              🚪
            </Link>
            <Link
              href="/sign-out"
              className="hidden rounded-full border border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9db3ff] transition hover:border-white/30 hover:text-white md:inline-flex"
            >
              {tActions("signOut")}
            </Link>
            <Link
              href="/profile"
              className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition hover:border-white/30 hover:bg-white/10"
              aria-label={tAria("profile")}
            >
              {currentUserAvatar ? (
                <img
                  src={currentUserAvatar}
                  alt={currentUserName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-white">
                  {currentUserName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 pb-[calc(72px+env(safe-area-inset-bottom,0))] md:pb-0">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-[#0a1024]/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom,0))] pt-1.5 shadow-[0_-18px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-5 items-center gap-1 text-[7px] font-semibold uppercase tracking-[0.15em] text-[#8a96c2]">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                      "flex flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1.5 transition",
                    isActive
                        ? "bg-white/12 text-white shadow-[0_18px_35px_-24px_rgba(122,75,255,0.7)]"
                      : "hover:text-white",
                  )}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="leading-tight text-[7px]">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

