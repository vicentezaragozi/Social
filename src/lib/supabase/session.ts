import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type VenueSessionRow = Database["public"]["Tables"]["venue_sessions"]["Row"];

export const ensureActiveVenueSession = async (params: {
  venueId: string;
  profileId: string;
}) => {
  const supabase = await getSupabaseServerClient();

  const { data: existing, error: lookupError } = await supabase
    .from("venue_sessions")
    .select("*")
    .eq("venue_id", params.venueId)
    .eq("profile_id", params.profileId)
    .eq("status", "active")
    .is("exited_at", null)
    .order("entered_at", { ascending: false })
    .limit(1)
    .maybeSingle<VenueSessionRow>();

  if (lookupError && lookupError.code !== "PGRST116") {
    console.error("Failed to find active session", lookupError);
  }

  if (existing) {
    return existing;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("venue_sessions")
    .insert({
      venue_id: params.venueId,
      profile_id: params.profileId,
      status: "active",
    })
    .select()
    .maybeSingle<VenueSessionRow>();

  if (insertError || !inserted) {
    console.error("Failed to create active session", insertError);
    throw new Error("Could not create active session for this venue.");
  }

  return inserted;
};

