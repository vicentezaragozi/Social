import "@/app/globals.css";

import Link from "next/link";

import { SocialWordmark } from "@/components/brand/social-wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#040918] text-white">
      <header className="border-b border-white/10 bg-[rgba(10,16,36,0.85)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <SocialWordmark asLink href="/" compact className="tracking-[0.45em]" />
          <nav className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8a96c2] md:text-xs">
          </nav>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}


