import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getAdminMemberships } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { updateSongRequestStatus } from "@/app/[locale]/admin/requests/actions";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminSongRequests({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ venue?: string }>;
}) {
  const { locale } = await params;
  const searchParamsData = await searchParams;
  const { memberships, user } = await getAdminMemberships();
  const t = await getTranslations({ locale, namespace: "admin.requests" });
  const tStatus = await getTranslations({ locale, namespace: "common.status" });
  
  const activeMembership = searchParamsData.venue
    ? memberships.find((entry) => entry.venue_id === searchParamsData.venue)
    : memberships[0];

  if (!activeMembership) {
    redirect("/sign-in/admin?error=venue_access");
  }

  const venue = activeMembership.venues;
  const supabase = await getSupabaseServerClient();

  // Get admin profile for avatar/name display
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { data: requests } = await supabase
    .from("song_requests")
    .select(
      "id, song_title, artist, status, created_at, notes, whatsapp_thread_url, profiles:profile_id(display_name)",
    )
    .eq("venue_id", venue.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <AdminShell 
      userEmail={user.email ?? ""} 
      venues={memberships.map((entry) => entry.venues)}
      profileAvatar={adminProfile?.avatar_url ?? null}
      profileName={adminProfile?.display_name ?? null}
    >
    <main className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-white">{t("title")}</h1>
        <p className="text-sm text-[var(--muted)]">
          {t("description")}
        </p>
      </header>

      <div className="overflow-x-auto rounded-3xl border border-[#223253] bg-[#0d162a]">
        <table className="min-w-full divide-y divide-[#1d2946] text-sm text-[var(--muted)]">
          <thead className="bg-[#111c32] text-xs uppercase tracking-[0.2em]">
            <tr>
              <th className="px-4 py-3 text-left">{t("table.request")}</th>
              <th className="px-4 py-3 text-left">{t("table.guest")}</th>
              <th className="px-4 py-3 text-left">{t("table.status")}</th>
              <th className="px-4 py-3 text-left">{t("table.actions")}</th>
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
                    {tStatus(request.status as "pending" | "completed" | "cancelled")}
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
                        {t("actions.openChat")}
                      </Link>
                    ) : null}
                    {request.status !== "completed" ? (
                    <form
                      action={async (formData) => {
                          "use server";
                        await updateSongRequestStatus({ success: false }, formData);
                      }}
                    >
                      <input type="hidden" name="venueId" value={venue.id} />
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="status" value="completed" />
                      <button className="rounded-xl border border-[#2f9b7a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]">
                        {t("actions.markPlayed")}
                      </button>
                    </form>
                    ) : null}
                    {request.status !== "cancelled" ? (
                      <form
                        action={async (formData) => {
                          "use server";
                          await updateSongRequestStatus({ success: false }, formData);
                        }}
                      >
                        <input type="hidden" name="venueId" value={venue.id} />
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button className="rounded-xl border border-[#553432] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7]">
                          {t("actions.cancel")}
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
    </AdminShell>
  );
}


