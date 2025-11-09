import { getSupabaseServerClient } from "@/lib/supabase/server";

import type { Database } from "./types";

type VenueRow = Database["public"]["Tables"]["venues"]["Row"];

export const getDefaultVenue = async (): Promise<VenueRow> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<VenueRow>();

  if (error) {
    console.error("Failed to load default venue", error);
    throw new Error("Unable to load venue data.");
  }

  if (!data) {
    throw new Error(
      "No venues configured. Add at least one venue row in Supabase to continue.",
    );
  }

  return data;
};

