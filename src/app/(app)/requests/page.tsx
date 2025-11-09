import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDefaultVenue } from "@/lib/supabase/venues";

import { SongRequestForm } from "@/components/connect/song-request-form";

export const metadata = {
  title: "Song Requests",
};

export default async function RequestsPage() {
  const session = await requireAuthSession();
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-semibold">You&apos;re almost there</h1>
        <p className="text-sm text-[var(--muted)]">
          Complete onboarding so the DJ knows who&apos;s buzzing them.
        </p>
      </div>
    );
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

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 pb-32 pt-10 text-white">
      <header className="mb-6 space-y-3">
        <span className="rounded-full border border-[#1d2946] px-3 py-1 text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
          DJ Link
        </span>
        <h1 className="text-2xl font-semibold">
          Request a track for tonight&apos;s vibe.
        </h1>
        <p className="text-sm text-[var(--muted)]">
          We&apos;ll log your request and open WhatsApp with the DJ&apos;s number and a pre-filled
          message. Feel free to add a dedication or timing note.
        </p>
        <p className="text-xs text-[var(--muted)]">
          We&apos;ll send updates to <span className="text-white">{session.user.email}</span>
        </p>
      </header>

      <SongRequestForm
        venueId={venue.id}
        currentSongsCount={songRequests?.length ?? 0}
      />
    </main>
  );
}

