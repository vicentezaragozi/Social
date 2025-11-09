"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-white">
      <div className="flex-1 pb-24">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1d2946] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur">
        <ul className="mx-auto flex max-w-lg items-center justify-between gap-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition",
                    isActive
                      ? "bg-[var(--surface-muted)] text-white shadow-[0_8px_20px_-12px_rgba(122,75,255,0.45)]"
                      : "hover:text-white",
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

