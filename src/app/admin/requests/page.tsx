import Link from "next/link";

import { requireAdminVenue } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { updateSongRequestStatus } from "@/app/admin/requests/actions";

export default async function AdminSongRequests({
  searchParams,
}: {
  searchParams: { venue?: string };
}) {
  const { venue } = await requireAdminVenue(searchParams.venue);
  const supabase = await getSupabaseServerClient();

  const { data: requests } = await supabase
    .from("song_requests")
    .select(
      "id, song_title, artist, status, created_at, notes, whatsapp_thread_url, profiles:profile_id(display_name)",
    )
    .eq("venue_id", venue.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Song request queue</h1>
        <p className="text-sm text-[var(--muted)]">
          Track WhatsApp requests and mark them as completed once played.
        </p>
      </header>

      <div className="overflow-x-auto rounded-3xl border border-[#223253] bg-[#0d162a]">
        <table className="min-w-full divide-y divide-[#1d2946] text-sm text-[var(--muted)]">
          <thead className="bg-[#111c32] text-xs uppercase tracking-[0.2em]">
            <tr>
              <th className="px-4 py-3 text-left">Request</th>
              <th className="px-4 py-3 text-left">Guest</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1d2946]">
            {requests?.map((request) => (
              <tr key={request.id} className="hover:bg-[#101b33]">
                <td className="px-4 py-4 text-white">
                  <div className="font-semibold">{request.song_title}</div>
                  {request.artist ? (
                    <div className="text-xs text-[var(--muted)]">
                      {request.artist}
                    </div>
                  ) : null}
                  {request.notes ? (
                    <div className="text-xs text-[#ffb224]">{request.notes}</div>
                  ) : null}
                  <div className="text-xs text-[var(--muted)]">
                    {new Date(request.created_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {request.profiles?.display_name ?? "Guest"}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={
                      request.status === "completed" ? "text-[#5ef1b5]" : undefined
                    }
                  >
                    {request.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {request.whatsapp_thread_url ? (
                      <Link
                        href={request.whatsapp_thread_url}
                        target="_blank"
                        className="rounded-xl border border-[#2f9b7a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]"
                      >
                        Open chat
                      </Link>
                    ) : null}
                    <form
                      action={async (formData) => {
                        await updateSongRequestStatus({ success: false }, formData);
                      }}
                    >
                      <input type="hidden" name="venueId" value={venue.id} />
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="status" value="completed" />
                      <button className="rounded-xl border border-[#2f9b7a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]">
                        Mark played
                      </button>
                    </form>
                    {request.status !== "cancelled" ? (
                      <form
                        action={async (formData) => {
                          await updateSongRequestStatus({ success: false }, formData);
                        }}
                      >
                        <input type="hidden" name="venueId" value={venue.id} />
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button className="rounded-xl border border-[#553432] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7]">
                          Cancel
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}


