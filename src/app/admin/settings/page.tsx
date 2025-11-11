import { Suspense } from "react";

import { AdminSettingsTabs } from "@/components/admin/settings/admin-settings-tabs";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminMemberships, requireAdminVenue } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type VenueRow = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  capacity: number | null;
  website_url: string | null;
  instagram_handle: string | null;
  phone_number: string | null;
  amenities: string[] | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
};

type SessionRow = {
  id: string;
  venue_id: string;
  session_name: string;
  session_description: string | null;
  session_type: "event" | "daily" | "weekly" | "custom";
  duration_hours: number;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
  entry_fee_cents: number | null;
  entry_fee_currency: string | null;
  created_at: string;
  updated_at: string;
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  const { venue: venueParam } = await searchParams;
  const { venue } = await requireAdminVenue(venueParam);
  const { memberships, user } = await getAdminMemberships();
  const supabase = await getSupabaseServerClient();
  let venueError: Error | null = null;
  let venueRow: VenueRow | null = null;

  const venueSelect = await supabase
    .from("venues")
    .select(
      [
        "id",
        "name",
        "description",
        "address",
        "capacity",
        "website_url",
        "instagram_handle",
        "phone_number",
        "amenities",
        "logo_url",
        "cover_image_url",
        "gallery_urls",
      ].join(", "),
    )
    .eq("id", venue.id)
    .maybeSingle<VenueRow>();

  if (venueSelect.error && venueSelect.error.code === "42703") {
    const fallbackVenue = await supabase
      .from("venues")
      .select(
        [
          "id",
          "name",
          "description",
          "address",
          "capacity",
          "website_url",
          "instagram_handle",
          "phone_number",
          "amenities",
          "logo_url",
          "cover_image_url",
        ].join(", "),
      )
      .eq("id", venue.id)
      .maybeSingle<VenueRow>();

    venueRow = fallbackVenue.data ?? null;
    venueError = fallbackVenue.error ? new Error(fallbackVenue.error.message) : null;
  } else {
    venueRow = venueSelect.data ?? null;
    venueError = venueSelect.error ? new Error(venueSelect.error.message) : null;
  }

  const sessionSelect = await supabase
    .from("session_metadata")
    .select(
      [
        "id",
        "session_name",
        "session_description",
        "session_type",
        "duration_hours",
        "is_active",
        "start_time",
        "end_time",
        "entry_fee_cents",
        "entry_fee_currency",
        "created_at",
      ].join(", "),
    )
    .eq("venue_id", venue.id)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<SessionRow[]>();

  const normalizeSession = (row: Partial<SessionRow> | null): SessionRow | null => {
    if (!row) return null;
    return {
      id: row.id ?? "",
      venue_id: row.venue_id ?? venue.id,
      session_name: row.session_name ?? "",
      session_description: row.session_description ?? null,
      session_type: row.session_type ?? "event",
      duration_hours: row.duration_hours ?? 1,
      is_active: row.is_active ?? false,
      start_time: row.start_time ?? null,
      end_time: row.end_time ?? null,
      entry_fee_cents: row.entry_fee_cents ?? null,
      entry_fee_currency: row.entry_fee_currency ?? null,
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? new Date().toISOString(),
    };
  };

  let session: SessionRow | null = normalizeSession(sessionSelect.data?.[0] ?? null);

  if (sessionSelect.error && sessionSelect.error.code === "42703") {
    const fallbackSession = await supabase
      .from("session_metadata")
      .select(
        [
          "id",
          "session_name",
          "session_description",
          "session_type",
          "duration_hours",
          "is_active",
          "start_time",
          "end_time",
          "created_at",
        ].join(", "),
      )
      .eq("venue_id", venue.id)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .returns<SessionRow[]>();

    session = normalizeSession(fallbackSession.data?.[0] ?? null);
  }

  const effectiveVenue: VenueRow = venueRow ?? {
    id: venue.id,
    name: venue.name,
    description: null,
    address: null,
    capacity: null,
    website_url: null,
    instagram_handle: null,
    phone_number: null,
    amenities: [],
    logo_url: null,
    cover_image_url: null,
    gallery_urls: [],
  };

  return (
    <AdminShell userEmail={user.email ?? ""} venues={memberships.map((entry) => entry.venues)}>
      <Suspense
        fallback={
          <div className="rounded-3xl border border-[#1f2c49] bg-[#0d162a]/80 p-8 text-[var(--muted)]">
            Loading settings…
          </div>
        }
      >
        {venueError && (
          <div className="mb-4 rounded-3xl border border-[#5c2a40] bg-[#301321] px-6 py-4 text-sm text-[#ff8ba7]">
            Unable to load some venue metadata. Defaults are shown instead.
          </div>
        )}
        <AdminSettingsTabs venue={effectiveVenue} session={session} />
      </Suspense>
    </AdminShell>
  );
}


