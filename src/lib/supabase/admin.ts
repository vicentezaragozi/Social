import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

import type { Database } from "./types";

export type VenueMembership =
  Database["public"]["Tables"]["venue_memberships"]["Row"] & {
    venues: Database["public"]["Tables"]["venues"]["Row"];
  };

export const getAdminMemberships = async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: memberships, error } = await supabase
    .from("venue_memberships")
    .select(
      "id, role, venue_id, show_in_guest_feed, created_at, venues:venue_id(id, name, slug, location, timezone, created_at)",
    )
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to load admin memberships", error);
    throw new Error("Unable to load admin access.");
  }

  return { user, memberships: memberships ?? [] };
};

export const requireAdminVenue = async (venueId?: string) => {
  const { memberships, user } = await getAdminMemberships();

  if (!memberships.length) {
    redirect("/sign-in?error=admin_required");
  }

  if (!venueId) {
    return { user, venue: memberships[0].venues };
  }

  const membership = memberships.find((entry) => entry.venue_id === venueId);

  if (!membership) {
    redirect("/admin?error=venue_access");
  }

  return { user, venue: membership.venues };
};

