"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { SocialWordmark } from "@/components/brand/social-wordmark";

type Venue = {
  id: string;
  name: string;
  slug: string | null;
};

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Guests" },
  { href: "/admin/requests", label: "Song Queue" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({
  children,
  userEmail,
  venues,
}: {
  children: React.ReactNode;
  userEmail: string;
  venues: Venue[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeVenueId = useMemo(() => {
    const fromQuery = searchParams.get("venue");
    if (fromQuery && venues.some((venue) => venue.id === fromQuery)) {
      return fromQuery;
    }
    return venues[0]?.id ?? "";
  }, [searchParams, venues]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-[#1d2946] bg-[var(--surface)]/80 px-6 py-5 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <SocialWordmark className="tracking-[0.6em]" />
            <div className="border-l border-[#1d2946] pl-4">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Admin</p>
              <h1 className="text-xl font-semibold">Venue Dashboard</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)] sm:justify-end">
            <span>{userEmail}</span>
            {venues.length ? (
              <span>
                Venue:{" "}
                <span className="text-white">
                  {venues.find((venue) => venue.id === activeVenueId)?.name ?? venues[0].name}
                </span>
              </span>
            ) : null}
            <Link
              href="/sign-out"
              className="inline-flex items-center gap-2 rounded-full border border-[#223253] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:border-white"
            >
              Sign out
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

