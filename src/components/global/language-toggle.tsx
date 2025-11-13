"use client";

import {useLocale, useTranslations} from "next-intl";
import {useSearchParams} from "next/navigation";
import {useTransition} from "react";

import type {AppLocale} from "@/i18n";
import {usePathname, useRouter} from "@/i18n";
import {cn} from "@/lib/utils";

const SUPPORTED_LOCALES: AppLocale[] = ["en", "es"];

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("common.languageToggle");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (nextLocale: AppLocale) => {
    if (locale === nextLocale) return;

    startTransition(() => {
      // Preserve all query parameters when switching locales
      const params = new URLSearchParams();
      searchParams.forEach((value, key) => {
        params.set(key, value);
      });
      const queryString = params.toString();
      // Construct the full path with query params
      const targetPath = queryString ? `${pathname}?${queryString}` : pathname;
      // next-intl router.replace accepts pathname and locale option
      router.replace(targetPath, { locale: nextLocale });
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9db3ff]",
        "transition focus-within:border-white/40 focus-within:text-white",
        className,
      )}
      role="group"
      aria-label={t("englishLabel") + " / " + t("spanishLabel")}
    >
      {SUPPORTED_LOCALES.map((optionLocale, index) => {
        const isActive = optionLocale === locale;
        const labelKey =
          optionLocale === "en" ? "englishShort" : "spanishShort";
        const announceKey =
          optionLocale === "en" ? "englishLabel" : "spanishLabel";

        return (
          <button
            key={optionLocale}
            type="button"
            onClick={() => handleSelect(optionLocale)}
            disabled={isPending}
            aria-pressed={isActive}
            aria-label={t(announceKey)}
            className={cn(
              "rounded-full px-2 py-1 transition",
              isActive ? "bg-white text-[#040918]" : "hover:text-white",
              index === 0 ? "ml-0" : "mr-0",
            )}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}

