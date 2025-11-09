import { requireAdminVenue } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { updateGuestStatus } from "@/app/admin/users/actions";
import type { Database } from "@/lib/supabase/types";

import { GuestList } from "@/components/admin/guest-list";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { venue?: string };
}) {
  const { venue } = await requireAdminVenue(searchParams.venue);
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("venue_sessions")
    .select("id, profile_id, status, entered_at, exited_at, profiles(*)")
    .eq("venue_id", venue.id)
    .order("entered_at", { ascending: false })
    .limit(200);

  const guestsMap = new Map<
    string,
    {
      profile: Database["public"]["Tables"]["profiles"]["Row"];
      sessions: Database["public"]["Tables"]["venue_sessions"]["Row"][];
    }
  >();

  (data ?? []).forEach((row) => {
    if (!row.profiles) return;
    const profileRow = row.profiles as Database["public"]["Tables"]["profiles"]["Row"];
    const existing = guestsMap.get(row.profile_id);
    const sessionEntry = {
      id: row.id,
      profile_id: row.profile_id,
      venue_id: venue.id,
      status: row.status,
      entered_at: row.entered_at,
      exited_at: row.exited_at,
      device_fingerprint: null,
      created_at: row.entered_at,
    } as Database["public"]["Tables"]["venue_sessions"]["Row"];

    if (existing) {
      existing.sessions.push(sessionEntry);
    } else {
      guestsMap.set(row.profile_id, {
        profile: profileRow,
        sessions: [sessionEntry],
      });
    }
  });

  const guests = Array.from(guestsMap.values());

  return (
    <GuestList
      action={updateGuestStatus}
      guests={guests}
      venueId={venue.id}
    />
  );
}

