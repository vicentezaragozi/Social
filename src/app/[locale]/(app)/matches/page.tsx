import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile, getProfileBlockStatus } from "@/lib/supabase/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { MatchesView } from "@/components/connect/matches-view";
import { BlockedNotice } from "@/components/app/blocked-notice";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.matches" });
  return {
    title: t("title"),
  };
}

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user } = await requireAuthSession();
  const profile = await getCurrentProfile();
  const t = await getTranslations({ locale, namespace: "app.matches" });

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6 py-16 text-center text-white">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">{t("onboardingRequired.title")}</h1>
          <p className="text-sm text-[var(--muted)]">
            {t("onboardingRequired.description")}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="rounded-2xl border border-[#1d2946] px-5 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-white"
        >
          {t("onboardingRequired.button")}
        </Link>
      </main>
    );
  }

  const { isBlocked } = getProfileBlockStatus(profile);
  if (isBlocked) {
    return <BlockedNotice profile={profile} />;
  }

  const supabase = await getSupabaseServerClient();

  const [pendingIncomingRes, pendingOutgoingRes, matchesRes] = await Promise.all([
    supabase
      .from("interactions")
      .select(
        "id, venue_session_id, sender_id, receiver_id, interaction_type, status, message, created_at, responded_at, sender:profiles!interactions_sender_id_fkey(id, display_name, avatar_url, bio, gallery_urls, phone_number, blocked_until, blocked_reason)",
      )
      .eq("receiver_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("interactions")
      .select(
        "id, venue_session_id, sender_id, receiver_id, interaction_type, status, message, created_at, responded_at, receiver:profiles!interactions_receiver_id_fkey(id, display_name, avatar_url, bio, gallery_urls, phone_number, blocked_until, blocked_reason)",
      )
      .eq("sender_id", profile.id)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select(
        "id, interaction_id, profile_a, profile_b, whatsapp_url, created_at, profiles:profiles!matches_profile_a_fkey(id, display_name, avatar_url, bio, gallery_urls, phone_number, blocked_until, blocked_reason), profiles_b:profiles!matches_profile_b_fkey(id, display_name, avatar_url, bio, gallery_urls, phone_number, blocked_until, blocked_reason)",
      )
      .or(`profile_a.eq.${profile.id},profile_b.eq.${profile.id}`)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <MatchesView
      currentProfileId={profile.id}
      sessionEmail={user.email ?? ""}
      pendingIncoming={pendingIncomingRes.data ?? []}
      pendingOutgoing={pendingOutgoingRes.data ?? []}
      matches={matchesRes.data ?? []}
    />
  );
}

