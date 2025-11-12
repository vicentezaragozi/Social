import { redirect } from "next/navigation";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile, getProfileBlockStatus } from "@/lib/supabase/profile";
import { ensureActiveVenueSession } from "@/lib/supabase/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDefaultVenue } from "@/lib/supabase/venues";

import { ConnectFeed } from "@/components/connect/connect-feed";
import { BlockedNotice } from "@/components/app/blocked-notice";
import { TutorialModal } from "@/components/onboarding/tutorial-modal";
export const metadata = {
  title: "Connect",
};

export default async function ConnectPage() {
  const { user } = await requireAuthSession();
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/onboarding");
  }

  const { isBlocked } = getProfileBlockStatus(profile);

  if (isBlocked) {
    return <BlockedNotice profile={profile} />;
  }

  const supabase = await getSupabaseServerClient();

  // Check if user is admin
  const { data: adminCred } = await supabase
    .from("admin_credentials")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const venue = await getDefaultVenue();
  const profileId = profile.id;

  if (!profileId || profileId === "null") {
    throw new Error("Profile ID missing. Complete onboarding again or contact support.");
  }

  let activeSession;
  try {
    activeSession = await ensureActiveVenueSession({
    venueId: venue.id,
    profileId,
  });
  } catch (error) {
    console.warn("Redirecting to landing because session is inactive", error);
    redirect("/?error=session_inactive");
  }

  // Fetch blocked users to filter them out
  const { data: blockedUsers } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocker_id", profileId);

  const blockedIds = new Set(blockedUsers?.map((b) => b.blocked_id) ?? []);

  // Fetch admin visibility preferences for this venue
  const { data: venueMembers } = await supabase
    .from("venue_memberships")
    .select("user_id")
    .eq("venue_id", venue.id);

  const nowIso = new Date().toISOString();

  const [attendeesRes, outgoingRes, incomingRes, matchesRes, offersRes, savedOffersRes] =
    await Promise.all([
    supabase
      .from("venue_sessions")
      .select(
        "id, profile_id, venue_id, status, entered_at, exited_at, device_fingerprint, created_at, profiles:profile_id(*)",
      )
      .eq("venue_id", venue.id)
      .eq("status", "active")
      .is("exited_at", null),
    supabase
      .from("interactions")
      .select(
        "id, venue_session_id, sender_id, receiver_id, interaction_type, status, message, created_at, responded_at, receiver:profiles!interactions_receiver_id_fkey(id, display_name, avatar_url, bio, is_private)",
      )
      .eq("sender_id", profileId),
    supabase
      .from("interactions")
      .select(
        "id, venue_session_id, sender_id, receiver_id, interaction_type, status, message, created_at, responded_at, sender:profiles!interactions_sender_id_fkey(id, display_name, avatar_url, bio, is_private)",
      )
      .eq("receiver_id", profileId),
    supabase
      .from("matches")
      .select(
        "id, interaction_id, profile_a, profile_b, whatsapp_url, created_at, profiles:profiles!matches_profile_a_fkey(id, display_name, avatar_url, bio, is_private), profiles_b:profiles!matches_profile_b_fkey(id, display_name, avatar_url, bio, is_private)",
      )
      .or(`profile_a.eq.${profileId},profile_b.eq.${profileId}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select(
        "id, venue_id, title, description, cta_label, cta_url, image_url, promo_code, priority, start_at, end_at, is_active, created_at, updated_at",
      )
      .eq("venue_id", venue.id)
      .eq("is_active", true)
      .lte("start_at", nowIso)
      .or(`end_at.is.null,end_at.gt.${nowIso}`)
      .order("priority", { ascending: false })
      .order("start_at", { ascending: false }),
    supabase
      .from("offer_redemptions")
      .select("id, offer_id, promo_code, status, accepted_at, redeemed_at")
      .eq("profile_id", profileId),
  ]);

  if (attendeesRes.error) {
    console.error("Failed to load attendees", JSON.stringify(attendeesRes.error, null, 2));
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
  if (offersRes.error) {
    console.error("Failed to load offers", offersRes.error);
  }
  if (savedOffersRes.error) {
    console.error("Failed to load saved offers", savedOffersRes.error);
  }

  const isProfileBlocked = (profileRecord?: { blocked_until?: string | null }) => {
    if (!profileRecord?.blocked_until) {
      return false;
    }
    const until = new Date(profileRecord.blocked_until);
    return !Number.isNaN(until.getTime()) && until.getTime() > Date.now();
  };

  // Filter out blocked users and private guests from attendees
  let attendees = (attendeesRes.data ?? []).filter(
    (session) =>
      session.profile_id !== profileId &&
      !blockedIds.has(session.profile_id) &&
      !session.profiles?.is_private &&
      !isProfileBlocked(session.profiles ?? undefined),
  );

  const dedupeByProfile = <T extends { profile_id: string }>(records: T[]) => {
    const seen = new Set<string>();
    return records.filter((record) => {
      if (seen.has(record.profile_id)) {
        return false;
      }
      seen.add(record.profile_id);
      return true;
    });
  };

  attendees = dedupeByProfile(attendees);

  // Add admin profiles as pseudo-attendees if they want to appear in the feed
  if (venueMembers && venueMembers.length > 0) {
    // Fetch full profiles for admin users
    const adminUserIds = venueMembers
      .map((member) => member.user_id)
      .filter((id) => id !== profileId && !blockedIds.has(id) && !attendees.some((a) => a.profile_id === id));

    if (adminUserIds.length > 0) {
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", adminUserIds);

      if (adminProfiles) {
        const adminSessions = adminProfiles
          .filter((profile) => !isProfileBlocked(profile ?? undefined))
          .map((profile) => ({
            id: `admin-${profile.id}`, // Pseudo session ID
            profile_id: profile.id,
            venue_id: venue.id,
            status: "active" as const,
            entered_at: new Date().toISOString(),
            exited_at: null,
            device_fingerprint: null,
            created_at: new Date().toISOString(),
            profiles: profile,
            is_venue_host: true, // Flag to identify admin
          }));

        attendees = dedupeByProfile([...attendees, ...adminSessions]);
      }
    }
  }

  const isVisibleProfile = (
    _profileIdToCheck: string,
    profileRecord?: { is_private?: boolean | null },
  ) => !profileRecord?.is_private;

  const outgoing = (outgoingRes.data ?? []).filter((interaction) =>
    isVisibleProfile(
      interaction.receiver_id,
      interaction.receiver as { is_private?: boolean | null } | undefined,
    ),
  );
  const incoming = (incomingRes.data ?? []).filter((interaction) =>
    isVisibleProfile(
      interaction.sender_id,
      interaction.sender as { is_private?: boolean | null } | undefined,
    ),
  );
  const matches = (matchesRes.data ?? []).filter((match) => {
    const partner =
      match.profile_a === profileId
        ? (match.profiles_b as { id: string | null; is_private?: boolean | null } | null)
        : (match.profiles as { id: string | null; is_private?: boolean | null } | null);
    if (!partner?.id) return true;
    return isVisibleProfile(partner.id, partner);
  });
  const offers = offersRes.data ?? [];
  const savedOffers = savedOffersRes.data ?? [];

  return (
    <>
      <TutorialModal />
    <ConnectFeed
      currentProfile={{
        id: profileId,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        isPrivate: profile.is_private,
      }}
      venue={{
        id: venue.id,
        name: venue.name,
      }}
      activeSessionId={activeSession?.id ?? ""}
      attendees={attendees}
      outgoingInteractions={outgoing as any}
      incomingInteractions={incoming as any}
      matches={matches as any}
      sessionEmail={user.email ?? ""}
      offers={offers}
      offerRedemptions={savedOffers}
    />
    </>
  );
}

