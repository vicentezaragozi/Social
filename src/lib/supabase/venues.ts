import { getSupabaseServerClient } from "@/lib/supabase/server";

import type { Database } from "./types";

type VenueRow = Database["public"]["Tables"]["venues"]["Row"];

export const getDefaultVenue = async (): Promise<VenueRow> => {
  const supabase = await getSupabaseServerClient();

  const { data: rpcData, error: rpcError } = await supabase.rpc("get_default_venue");

  if (rpcError) {
    console.error("Failed to load default venue via RPC", rpcError);
    throw new Error("Unable to load venue data.");
  }

  if (!rpcData) {
    throw new Error(
      "No venues configured. Add at least one venue row in Supabase to continue.",
    );
  }

  return rpcData as VenueRow;
};

