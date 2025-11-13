import "@/app/globals.css";

import Link from "next/link";

import { SocialWordmark } from "@/components/brand/social-wordmark";
import { LanguageToggle } from "@/components/global/language-toggle";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#040918] text-white">
      <header className="border-b border-white/10 bg-[rgba(10,16,36,0.85)] px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <SocialWordmark asLink href="/app" />
          <div className="flex items-center gap-3">
            <LanguageToggle className="shrink-0" />
            <Link
              href="/sign-in"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#9db3ff] transition hover:border-white/30 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}


