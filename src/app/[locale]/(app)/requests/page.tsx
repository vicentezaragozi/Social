import { getTranslations } from "next-intl/server";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile, getProfileBlockStatus } from "@/lib/supabase/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDefaultVenue } from "@/lib/supabase/venues";

import { SongRequestForm } from "@/components/connect/song-request-form";
import { BlockedNotice } from "@/components/app/blocked-notice";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.requests" });
  return {
    title: t("title"),
  };
}

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user } = await requireAuthSession();
  const profile = await getCurrentProfile();
  const t = await getTranslations({ locale, namespace: "app.requests" });
  const tStatus = await getTranslations({ locale, namespace: "common.status" });

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-semibold">{t("onboardingRequired.title")}</h1>
        <p className="text-sm text-[var(--muted)]">
          {t("onboardingRequired.description")}
        </p>
      </div>
    );
  }

  const { isBlocked } = getProfileBlockStatus(profile);
  if (isBlocked) {
    return <BlockedNotice profile={profile} />;
  }

  const venue = await getDefaultVenue();

  const supabase = await getSupabaseServerClient();
  // eslint-disable-next-line react-hooks/purity
  const dayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: songRequests } = await supabase
    .from("song_requests")
    .select("id")
    .eq("venue_id", venue.id)
    .gte("created_at", dayAgoIso);

  // Fetch user's own song requests
  const { data: userRequests } = await supabase
    .from("song_requests")
    .select("id, song_title, artist, notes, status, created_at")
    .eq("profile_id", profile.id)
    .eq("venue_id", venue.id)
    .gte("created_at", dayAgoIso)
    .order("created_at", { ascending: false });

  return (
    <main className="mobile-safe min-h-screen bg-[var(--background)] text-white">
      <div className="px-4 pb-32 pt-10">
        <header className="mb-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            {t("title")}
          </p>
          <h1 className="text-2xl font-semibold">
            {t("header.subtitle")}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {t("header.description")}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {t("header.updatesSent")} <span className="text-white">{user.email}</span>
          </p>
        </header>

        <SongRequestForm
          venueId={venue.id}
          currentSongsCount={songRequests?.length ?? 0}
        />

        {userRequests && userRequests.length > 0 && (
          <section className="mt-8 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              {t("yourRequests.title")}
            </h2>
            <div className="space-y-3">
              {userRequests.map((request) => {
                const timestamp = new Date(request.created_at ?? 0).toLocaleString([], {
                  hour: "numeric",
                  minute: "2-digit",
                });
                const statusColors = {
                  pending: "border-[#2e3a5d] bg-[#101b33] text-[#9db3ff]",
                  completed: "border-[#264b3f] bg-[#122521] text-[#5ef1b5]",
                  cancelled: "border-[#5c2a40] bg-[#301321] text-[#ff8ba7]",
                };
                const statusLabels = {
                  pending: tStatus("inQueue"),
                  completed: tStatus("played"),
                  cancelled: tStatus("declined"),
                };
                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-[#223253] bg-[#0d162a] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-white">
                          {request.song_title}
                        </p>
                        {request.artist && (
                          <p className="text-xs text-[var(--muted)]">{request.artist}</p>
                        )}
                        {request.notes && (
                          <p className="text-xs italic text-[var(--muted)]">
                            &quot;{request.notes}&quot;
                          </p>
                        )}
                        <p className="text-xs text-[var(--muted)]">{t("yourRequests.requestedAt")} {timestamp}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                          statusColors[request.status as keyof typeof statusColors]
                        }`}
                      >
                        {statusLabels[request.status as keyof typeof statusLabels]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

