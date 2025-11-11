"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialWordmark } from "@/components/brand/social-wordmark";
import { cn } from "@/lib/utils";

const navItems: Array<{
  href: string;
  label: string;
  icon: string;
}> = [
  { href: "/app", label: "Connect", icon: "❤️" },
  { href: "/matches", label: "Matches", icon: "✨" },
  { href: "/requests", label: "Requests", icon: "🎵" },
  { href: "/offers", label: "Offers", icon: "🎁" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export function AppShell({ 
  children,
  currentUserAvatar,
  currentUserName,
}: { 
  children: React.ReactNode;
  currentUserAvatar: string | null;
  currentUserName: string;
}) {
  const pathname = usePathname();

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
            <Link
              href="/sign-out"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold uppercase tracking-[0.3em] text-[#9db3ff] transition hover:border-white/30 hover:bg-white/10 md:hidden"
              aria-label="Sign out"
            >
              ⎋
            </Link>
            <Link
              href="/sign-out"
              className="hidden rounded-full border border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9db3ff] transition hover:border-white/30 hover:text-white md:inline-flex"
            >
              Sign out
            </Link>
            <Link
              href="/profile"
              className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition hover:border-white/30 hover:bg-white/10"
              aria-label="Profile"
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

      <div className="flex-1 pb-[calc(96px+env(safe-area-inset-bottom,0))] md:pb-0">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-[#0a1024]/95 px-3 pb-[calc(10px+env(safe-area-inset-bottom,0))] pt-2 shadow-[0_-18px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-5 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8a96c2]">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition",
                    isActive
                        ? "bg-white/12 text-white shadow-[0_18px_35px_-24px_rgba(122,75,255,0.7)]"
                      : "hover:text-white",
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                    <span className="whitespace-nowrap text-[10px]">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

