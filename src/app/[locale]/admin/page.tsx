import { cache, Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { requireAdminVenue } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminMemberships } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { AttendanceChart } from "@/components/admin/attendance-chart";

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
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ venue?: string }>;
}) {
  const { locale } = await params;
  const { venue: venueParam } = await searchParams;
  const { venue, user } = await requireAdminVenue(venueParam);
  const supabase = await getSupabaseServerClient();
  
  // Check if onboarding is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { data: sessionMeta } = await supabase
    .from("session_metadata")
    .select("id")
    .eq("venue_id", venue.id)
    .eq("is_active", true)
    .maybeSingle();

  // Redirect to onboarding if not complete
  if (!profile?.display_name || !profile?.avatar_url || !sessionMeta) {
    redirect("/sign-in/admin/onboarding");
  }

  // Get admin memberships for shell
  const { memberships, user: adminUser } = await getAdminMemberships();
  
  // Get admin profile for avatar/name display
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", adminUser.id)
    .maybeSingle();

  const startOfDay = toStartOfDayIso();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

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
        .gte("entered_at", sevenDaysAgoIso),
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

  const attendanceEvents = (sessionsRes.data ?? [])
    .map((row) => {
      const time = new Date(row.entered_at).getTime();
      return Number.isNaN(time) ? null : time;
    })
    .filter((time): time is number => time !== null);

  const buildHourlySeries = (hours: number) => {
    const series: { label: string; value: number }[] = [];
    for (let i = hours; i >= 1; i -= 1) {
      const bucketStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const bucketEnd = new Date(bucketStart.getTime() + 60 * 60 * 1000);
      const count = attendanceEvents.filter(
        (timestamp) => timestamp >= bucketStart.getTime() && timestamp < bucketEnd.getTime(),
      ).length;
      const label = bucketStart
        .toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        })
        .toUpperCase();
      series.push({ label, value: count });
    }
    return series;
  };

  const buildDailySeries = (days: number) => {
    const series: { label: string; value: number }[] = [];
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i -= 1) {
      const bucketStart = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
      const bucketEnd = new Date(bucketStart.getTime() + 24 * 60 * 60 * 1000);
      const count = attendanceEvents.filter(
        (timestamp) => timestamp >= bucketStart.getTime() && timestamp < bucketEnd.getTime(),
      ).length;
      const label = bucketStart.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      series.push({ label, value: count });
    }
    return series;
  };

  const attendanceSeriesByRange = {
    "12h": buildHourlySeries(12),
    "24h": buildHourlySeries(24),
    "7d": buildDailySeries(7),
  };

  const t = await getTranslations({ locale, namespace: "admin.dashboard" });

  return (
    <AdminShell 
      userEmail={adminUser?.email ?? ""} 
      venues={memberships.map((entry) => entry.venues)}
      profileAvatar={adminProfile?.avatar_url ?? null}
      profileName={adminProfile?.display_name ?? null}
    >
      <Suspense fallback={<div className="p-6 text-[var(--muted)]">{t("loading")}</div>}>
        <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <DashboardCard title={t("cards.currentAttendance")} value={attendance} />
        <DashboardCard title={t("cards.matchesToday")} value={matchesToday} />
        <DashboardCard title={t("cards.songRequests")} value={songsRequestedToday} />
        <DashboardCard title={t("cards.newCustomers")} value={newCustomersToday} />
      </section>

      <AttendanceChart seriesByRange={attendanceSeriesByRange} />
        </div>
      </Suspense>
    </AdminShell>
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

