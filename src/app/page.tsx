import { redirect } from "next/navigation";

import { LandingPage } from "@/components/landing/landing-page";
import { deactivateSessionNow } from "@/lib/supabase/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Social - Select Your Venue",
};

export default async function HomePage() {
  // Check if user is already authenticated
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If authenticated, check if they have an active session
  if (user) {
    const { data: activeSession } = await supabase
      .from("venue_sessions")
      .select("id, venue_id")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .is("exited_at", null)
      .maybeSingle();

    // If they have an active session, redirect to app
    if (activeSession) {
      redirect("/app");
    }

    // If authenticated but no active session, show venue selector
    // (They need to join a new session)
  }

  const { data: sessionRows, error: sessionError } = await supabase
    .from("session_metadata")
    .select("id, venue_id, end_time")
    .eq("is_active", true);

  if (sessionError) {
    console.error("Failed to fetch session metadata:", sessionError);
  }

  const now = new Date();
  const activeVenueIds: string[] = [];
  const expiredSessionIds: string[] = [];

  for (const session of sessionRows ?? []) {
    if (session.end_time && new Date(session.end_time) <= now) {
      expiredSessionIds.push(session.id);
    } else {
      activeVenueIds.push(session.venue_id);
    }
  }

  if (expiredSessionIds.length) {
    await Promise.all(expiredSessionIds.map((sessionId) => deactivateSessionNow(sessionId)));
  }

  const uniqueActiveVenueIds = Array.from(new Set(activeVenueIds));

  if (uniqueActiveVenueIds.length === 0) {
    return <LandingPage venues={[]} />;
  }

  const { data: venues, error: venuesError } = await supabase
    .from("venues")
    .select("id, name, slug, description, logo_url, address")
    .in("id", uniqueActiveVenueIds)
    .order("name");

  if (venuesError) {
    console.error("Failed to fetch venues:", venuesError);
  }

  console.log("Venues fetched:", venues?.length ?? 0);

  return <LandingPage venues={venues ?? []} />;
}
