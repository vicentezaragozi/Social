import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AdminOnboardingFlow } from "@/components/admin/admin-onboarding-flow";

export const metadata = {
  title: "Admin Setup",
};

export default async function AdminOnboardingPage() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in/admin");
  }

  // Check if user is admin
  const { data: adminCred } = await supabase
    .from("admin_credentials")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!adminCred) {
    redirect("/sign-in/admin?error=not_admin");
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/sign-in/admin?error=profile_not_found");
  }

  // Get venue membership
  const { data: membership } = await supabase
    .from("venue_memberships")
    .select("venue_id, venues(id, name, slug, description, logo_url, address, capacity)")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch current session metadata if venue exists
  let normalizedSessionMetadata: {
    id: string;
    session_name: string;
    session_description: string | null;
    duration_hours: number;
    session_type: "event" | "daily" | "weekly" | "custom";
  } | null = null;

  if (membership?.venues) {
    const { data: sessionRows, error: sessionFetchError } = await supabase
      .from("session_metadata")
      .select("id, session_name, session_description, duration_hours, session_type")
      .eq("venue_id", membership.venues.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (sessionFetchError) {
      console.error("Failed to fetch session metadata", sessionFetchError);
    }

    if (sessionRows && sessionRows.length > 0) {
      const session = sessionRows[0];
      normalizedSessionMetadata = {
        id: session.id,
        session_name: session.session_name,
        session_description: session.session_description,
        duration_hours: session.duration_hours,
        session_type: (session.session_type ?? "event") as "event" | "daily" | "weekly" | "custom",
      };
    }
  }

  // Determine onboarding step - check in order
  let currentStep: "venue" | "session" | "profile" = "venue";
  
  // Check if venue is properly configured (needs description OR logo OR address beyond just name)
  const venueConfigured = membership?.venues &&
    membership.venues.name &&
    (membership.venues.description || membership.venues.logo_url || membership.venues.address);

  if (venueConfigured) {
    currentStep = "session";

    if (normalizedSessionMetadata) {
      currentStep = "profile";
      
      // Check if profile is complete - but allow staying on onboarding
      // to edit existing data
      // if (profile.display_name && profile.avatar_url) {
      //   redirect("/admin");
      // }
    }
  }

  return (
    <AdminOnboardingFlow
      currentStep={currentStep}
      profile={profile}
      venue={membership?.venues ?? null}
      userEmail={user.email ?? ""}
      sessionMetadata={normalizedSessionMetadata}
    />
  );
}

