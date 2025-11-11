import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { isSessionExpired } from "@/lib/session-utils";

type VenueSessionRow = Database["public"]["Tables"]["venue_sessions"]["Row"];
type SessionMetadataRow = Database["public"]["Tables"]["session_metadata"]["Row"];

type SupabaseClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

async function expireSession(
  supabase: SupabaseClient,
  session: SessionMetadataRow,
  exitedAtIso: string,
) {
  // Fetch active venue sessions before marking them exited
  const { data: activeSessions } = await supabase
    .from("venue_sessions")
    .select("profile_id")
    .eq("venue_id", session.venue_id)
    .eq("status", "active")
    .is("exited_at", null);

  const profileIds = (activeSessions ?? [])
    .map((row) => row.profile_id)
    .filter((value): value is string => Boolean(value));

  if (profileIds.length) {
    const { data: adminProfiles } = await supabase
      .from("admin_credentials")
      .select("profile_id")
      .in("profile_id", profileIds);

    const adminIds = new Set((adminProfiles ?? []).map((entry) => entry.profile_id));
    const guestIds = profileIds.filter((id) => !adminIds.has(id));

    if (guestIds.length) {
      await supabase
        .from("profiles")
        .update({ is_deactivated: true, deactivated_at: exitedAtIso })
        .in("id", guestIds);
    }
  }

  await supabase
    .from("venue_sessions")
    .update({ status: "inactive", exited_at: exitedAtIso })
    .eq("venue_id", session.venue_id)
    .eq("status", "active")
    .is("exited_at", null);

  await supabase
    .from("session_metadata")
    .update({ is_active: false, end_time: exitedAtIso })
    .eq("id", session.id);
}

async function getActiveSessionMetadataWithClient(
  supabase: SupabaseClient,
  venueId: string,
): Promise<SessionMetadataRow | null> {
  const now = new Date();

  const { data: sessions, error } = await supabase
    .from("session_metadata")
    .select("*")
    .eq("venue_id", venueId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getActiveSessionMetadata: failed to fetch metadata", error);
    throw new Error("Unable to load session information.");
  }

  if (!sessions || sessions.length === 0) {
    return null;
  }

  const [latest] = sessions;

  if (isSessionExpired(latest, now)) {
    await expireSession(supabase, latest, now.toISOString());
    return null;
  }

  return latest;
}

export const getActiveSessionMetadata = async (venueId: string) => {
  const supabase = await getSupabaseServerClient();
  return getActiveSessionMetadataWithClient(supabase, venueId);
};

export const ensureActiveVenueSession = async (params: {
  venueId: string;
  profileId: string;
}) => {
  const supabase = await getSupabaseServerClient();

  const metadata = await getActiveSessionMetadataWithClient(supabase, params.venueId);

  if (!metadata) {
    throw new Error("No active session available.");
  }

  console.log("ensureActiveVenueSession: looking up existing session", params);

  const { data: existing, error: existingError } = await supabase.rpc(
    "get_active_session",
    {
      rpc_profile_id: params.profileId,
      rpc_venue_id: params.venueId,
    },
  );

  if (existingError && existingError.code !== "PGRST116") {
    console.error("ensureActiveVenueSession: failed to fetch existing session", existingError);
  }

  if (existing && (existing as VenueSessionRow).id) {
    console.log("ensureActiveVenueSession: reusing session", existing);

    await supabase
      .from("profiles")
      .update({ is_deactivated: false, deactivated_at: null })
      .eq("id", params.profileId);

    return existing as VenueSessionRow;
  }

  console.log("ensureActiveVenueSession: creating new session", params);

  const { data: inserted, error: insertError } = await supabase.rpc(
    "create_active_session",
    {
      rpc_profile_id: params.profileId,
      rpc_venue_id: params.venueId,
    },
  );

  if (insertError || !inserted || !(inserted as VenueSessionRow).id) {
    console.error("ensureActiveVenueSession: failed to create session", insertError);
    throw new Error("Could not create active session for this venue.");
  }

  await supabase
    .from("profiles")
    .update({ is_deactivated: false, deactivated_at: null })
    .eq("id", params.profileId);

  console.log("ensureActiveVenueSession: created session", inserted);

  return inserted as VenueSessionRow;
};

export const deactivateSessionNow = async (sessionId: string) => {
  const supabase = await getSupabaseServerClient();
  const { data: session } = await supabase
    .from("session_metadata")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    throw new Error("Session not found.");
  }

  await expireSession(supabase, session, new Date().toISOString());
};

