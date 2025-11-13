import { getTranslations } from "next-intl/server";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile, getProfileBlockStatus } from "@/lib/supabase/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDefaultVenue } from "@/lib/supabase/venues";

import type { Database } from "@/lib/supabase/types";
import { BlockedNotice } from "@/components/app/blocked-notice";
import { OffersPanel, type OfferRedemptionSummary } from "@/components/connect/connect-feed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.offers" });
  return {
    title: t("title"),
  };
}

export default async function OffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAuthSession();
  const profile = await getCurrentProfile();
  const { isBlocked } = getProfileBlockStatus(profile);
  const t = await getTranslations({ locale, namespace: "app.offers" });
  
  if (profile && isBlocked) {
    return <BlockedNotice profile={profile} />;
  }

  const venue = await getDefaultVenue();

  const supabase = await getSupabaseServerClient();
  const { data: offersData } = await supabase
    .from("offers")
    .select(
      "id, venue_id, title, description, cta_label, cta_url, image_url, start_at, end_at, is_active, priority, created_at, updated_at",
    )
    .eq("venue_id", venue.id)
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("start_at", { ascending: false });

  const offers = (offersData ?? []) as Database["public"]["Tables"]["offers"]["Row"][];
  const { data: redemptions } = await supabase
    .from("offer_redemptions")
    .select("id, offer_id, promo_code, status, accepted_at, redeemed_at")
    .eq("profile_id", profile?.id ?? "");
  const redemptionMap = new Map<string, OfferRedemptionSummary>(
    (redemptions ?? []).map((entry) => [
      entry.offer_id,
      {
        offer_id: entry.offer_id,
        promo_code: entry.promo_code,
        status: entry.status,
        accepted_at: entry.accepted_at,
        redeemed_at: entry.redeemed_at,
      },
    ]),
  );

  return (
    <main className="mobile-safe min-h-screen bg-[var(--background)] text-white">
      <div className="px-4 pb-32 pt-10">
        <header className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            {t("header.subtitle")}
          </p>
          <h1 className="text-2xl font-semibold">{venue.name} {t("title")}</h1>
          <p className="text-sm text-[var(--muted)]">
            {t("header.description")}
          </p>
        </header>

        <OffersPanel offers={offers} redemptions={redemptionMap} />
      </div>
    </main>
  );
}

