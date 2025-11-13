"use client";

import { useTranslations } from "next-intl";

import type { Database } from "@/lib/supabase/types";
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function BlockedNotice({ profile }: { profile: ProfileRow }) {
  const t = useTranslations("common.blocked");
  const reason = profile.blocked_reason ?? "You have been blocked by venue staff.";
  let detail = t("contactStaff");

  if (profile.blocked_until) {
    const until = new Date(profile.blocked_until);
    if (!Number.isNaN(until.getTime())) {
      if (until.getTime() > Date.now()) {
        detail = t("blockLifts", { date: until.toLocaleString() });
      } else {
        detail = t("blockShouldLift");
      }
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 rounded-3xl border border-[#223253] bg-[#0d162a]/90 p-8 text-center shadow-lg shadow-black/30">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-white">{t("title")}</h2>
        <p className="text-sm text-[var(--muted)]">
          {t("description")}
        </p>
      </div>
      <div className="space-y-3 rounded-3xl border border-[#553432] bg-[#301321]/70 px-6 py-5 text-left text-sm text-[#ff8ba7]">
        <p className="font-semibold uppercase tracking-[0.3em] text-[#ffb2c5]">{t("reason")}</p>
        <p className="text-base text-white">{reason}</p>
        <p className="text-xs text-[var(--muted)]">{detail}</p>
      </div>
      <p className="text-xs text-[var(--muted)]">
        {t("help")}
      </p>
    </div>
  );
}

