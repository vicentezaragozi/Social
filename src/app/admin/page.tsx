import { cache } from "react";

import { requireAdminVenue } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const toStartOfDayIso = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
};

const getVenueSessionIds = cache(async (venueId: string) => {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("venue_sessions")
    .select("id")
    .eq("venue_id", venueId);

  return new Set((data ?? []).map((row) => row.id));
});

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { venue?: string };
}) {
  const targetVenueId = searchParams.venue;
  const { venue } = await requireAdminVenue(targetVenueId);
  const supabase = await getSupabaseServerClient();
  const startOfDay = toStartOfDayIso();
  // eslint-disable-next-line react-hooks/purity
  const twelveHoursAgoIso = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  const [attendanceRes, songRequestRes, newCustomersRes, sessionsRes, matchesDetailRes] =
    await Promise.all([
      supabase
        .from("venue_sessions")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venue.id)
        .eq("status", "active")
        .is("exited_at", null),
      supabase
        .from("song_requests")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venue.id)
        .gte("created_at", startOfDay),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay),
      supabase
        .from("venue_sessions")
        .select("entered_at")
        .eq("venue_id", venue.id)
        .gte("entered_at", twelveHoursAgoIso),
      supabase
        .from("matches")
        .select("id, created_at, interaction:interaction_id(venue_session_id)")
        .gte("created_at", startOfDay),
    ]);

  const sessionIds = await getVenueSessionIds(venue.id);

  const matchesToday =
    matchesDetailRes.data?.filter((match) => {
      const venueSessionId = match.interaction?.venue_session_id;
      return venueSessionId ? sessionIds.has(venueSessionId) : false;
    }).length ?? 0;

  const attendance = attendanceRes.count ?? 0;
  const songsRequestedToday = songRequestRes.count ?? 0;
  const newCustomersToday = newCustomersRes.count ?? 0;

  const peakHourData = (sessionsRes.data ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      const entered = new Date(row.entered_at);
      const hourKey = entered
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        })
        .toUpperCase();
      acc[hourKey] = (acc[hourKey] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const peakHourEntries = Object.entries(peakHourData).slice(-8);
  const peakMax = Math.max(...peakHourEntries.map(([, value]) => value), 1);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard title="Current attendance" value={attendance} />
        <DashboardCard title="Matches today" value={matchesToday} />
        <DashboardCard title="Song requests" value={songsRequestedToday} />
        <DashboardCard title="New customers" value={newCustomersToday} />
      </section>

      <section className="rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/25">
        <h2 className="text-lg font-semibold text-white">Peak hours (last 12h)</h2>
        {peakHourEntries.length ? (
          <div className="mt-6 flex h-48 items-end gap-3">
            {peakHourEntries.map(([hour, count]) => (
              <div key={hour} className="flex flex-1 flex-col items-center">
                <div
                  className="w-full rounded-t-2xl bg-[var(--accent)] transition"
                  style={{
                    height: `${(count / peakMax) * 100}%`,
                  }}
                />
                <span className="mt-2 text-xs text-[var(--muted)]">{hour}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No session data in the last 12 hours.
          </p>
        )}
      </section>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[#223253] bg-[#0d162a] p-5 shadow-lg shadow-black/30">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{title}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

