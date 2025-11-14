"use client";

import { useTranslations } from "next-intl";

export function RedirectLoading() {
  const t = useTranslations("auth.redirect");

  return (
    <div className="mobile-safe flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Spinning Circle */}
        <div className="flex justify-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-[#223253]"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[var(--accent)]"></div>
          </div>
        </div>

        {/* Loading Bar Animation */}
        <div className="space-y-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-[#223253]">
            <div 
              className="h-full w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
              style={{
                animation: "loadingBar 2s ease-in-out infinite"
              }}
            ></div>
          </div>
          <p className="text-sm text-[var(--muted)]">{t("message")}</p>
        </div>
      </div>
    </div>
  );
}

