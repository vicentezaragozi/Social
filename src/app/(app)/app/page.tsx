import { redirect } from "next/navigation";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { ensureActiveVenueSession } from "@/lib/supabase/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDefaultVenue } from "@/lib/supabase/venues";

import { ConnectFeed } from "@/components/connect/connect-feed";

export const metadata = {
  title: "Connect",
};

export default async function ConnectPage() {
  const session = await requireAuthSession();
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/onboarding");
  }

  const venue = await getDefaultVenue();
  const activeSession = await ensureActiveVenueSession({
    venueId: venue.id,
    profileId: profile.id,
  });

  const supabase = await getSupabaseServerClient();

  const [attendeesRes, outgoingRes, incomingRes, matchesRes] = await Promise.all([
    supabase
      .from("venue_sessions")
      .select(
        "id, profile_id, venue_id, status, entered_at, exited_at, device_fingerprint, created_at, profiles:profile_id(*)",
      )
      .eq("venue_id", venue.id)
      .eq("status", "active")
      .is("exited_at", null)
      .neq("profile_id", profile.id),
    supabase
      .from("interactions")
      .select(
        "id, venue_session_id, sender_id, receiver_id, interaction_type, status, message, created_at, responded_at",
      )
      .eq("sender_id", profile.id),
    supabase
      .from("interactions")
      .select(
        "id, venue_session_id, sender_id, receiver_id, interaction_type, status, message, created_at, responded_at",
      )
      .eq("receiver_id", profile.id),
    supabase
      .from("matches")
      .select("id, interaction_id, profile_a, profile_b, whatsapp_url, created_at")
      .or(`profile_a.eq.${profile.id},profile_b.eq.${profile.id}`),
  ]);

  if (attendeesRes.error) {
    console.error("Failed to load attendees", attendeesRes.error);
  }
  if (outgoingRes.error) {
    console.error("Failed to load outgoing interactions", outgoingRes.error);
  }
  if (incomingRes.error) {
    console.error("Failed to load incoming interactions", incomingRes.error);
  }
  if (matchesRes.error) {
    console.error("Failed to load matches", matchesRes.error);
  }

  const attendees = attendeesRes.data ?? [];
  const outgoing = outgoingRes.data ?? [];
  const incoming = incomingRes.data ?? [];
  const matches = matchesRes.data ?? [];

  return (
    <ConnectFeed
      currentProfile={{
        id: profile.id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
      }}
      venue={{
        id: venue.id,
        name: venue.name,
      }}
      activeSessionId={activeSession.id}
      attendees={attendees}
      outgoingInteractions={outgoing}
      incomingInteractions={incoming}
      matches={matches}
      sessionEmail={session.user.email ?? ""}
    />
  );
}

