import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { deactivateSessionNow } from "@/lib/supabase/session";

export const metadata = {
  title: "Join Session - Social",
};

type PageProps = {
  params: Promise<{ venueSlug: string }>;
};

export default async function JoinVenueRoute({ params }: PageProps) {
  const { venueSlug } = await params;
  const supabase = await getSupabaseServerClient();

  // Find venue by slug
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, slug")
    .eq("slug", venueSlug)
    .maybeSingle();

  if (!venue) {
    // Venue not found, redirect to landing page
    redirect("/?error=venue_not_found");
  }

  // Ensure venue has an active session
  const { data: activeSession } = await supabase
    .from("session_metadata")
    .select("id, end_time")
    .eq("venue_id", venue.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeSession) {
    redirect("/?error=no_active_session");
  }

  if (activeSession.end_time && new Date(activeSession.end_time) <= new Date()) {
    await deactivateSessionNow(activeSession.id);
    redirect("/?error=no_active_session");
  }

  // Check if user is already authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User is authenticated, check if they have an active session
    const { data: activeSession } = await supabase
      .from("venue_sessions")
      .select("id, venue_id")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .is("exited_at", null)
      .maybeSingle();

    if (activeSession) {
      // Already has active session
      if (activeSession.venue_id === venue.id) {
        // Same venue, go to app
        redirect("/app");
      } else {
        // Different venue, need to end current session first
        redirect(`/?error=active_session_exists&venue=${venue.slug}`);
      }
    }

    // User authenticated but no active session, create one and go to app
    // This will be handled by the session creation logic in /app route
  }

  // Store selected venue for sign-in flow
  // We'll use cookies for server-side access
  redirect(`/sign-in?venue=${venue.id}`);
}

