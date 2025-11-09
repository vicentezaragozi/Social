"use client";

import { useFormState } from "react-dom";

import type { Database } from "@/lib/supabase/types";
import type { UpdateUserState } from "@/app/admin/users/actions";
import { cn } from "@/lib/utils";

type GuestEntry = {
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  sessions: Database["public"]["Tables"]["venue_sessions"]["Row"][];
};

const initialState: UpdateUserState = {};

export function GuestList({
  guests,
  venueId,
  action,
}: {
  guests: GuestEntry[];
  venueId: string;
  action: (
    prevState: UpdateUserState,
    formData: FormData,
  ) => Promise<UpdateUserState>;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Guests</h2>
          <p className="text-sm text-[var(--muted)]">
            Manage who is currently in the venue and block disruptive guests.
          </p>
        </div>
        <span className="rounded-full border border-[#223253] px-3 py-1 text-xs text-[var(--muted)]">
          {guests.length} profiles
        </span>
      </header>

      {state.error ? (
        <p className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-2 text-xs text-[#ff8ba7]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-2xl border border-[#264b3f] bg-[#122521] px-4 py-2 text-xs text-[#5ef1b5]">
          Guest status updated.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-[#223253] bg-[#0d162a]">
        <table className="min-w-full divide-y divide-[#1d2946] text-sm">
          <thead className="bg-[#111c32] text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 text-left">Guest</th>
              <th className="px-4 py-3 text-left">Last seen</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Privacy</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1d2946] text-[var(--muted)]">
            {guests.map(({ profile, sessions }) => {
              const active = sessions.some(
                (session) => session.status === "active" && !session.exited_at,
              );
              const lastSeen = profile.last_seen_at
                ? new Date(profile.last_seen_at).toLocaleString()
                : "Unknown";
              const blocked = Boolean(profile.blocked_until);

              return (
                <tr key={profile.id} className="hover:bg-[#101b33]">
                  <td className="px-4 py-4 text-white">
                    <div className="font-semibold">{profile.display_name}</div>
                    {profile.blocked_reason ? (
                      <p className="text-xs text-[#ff8ba7]">
                        Reason: {profile.blocked_reason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">{lastSeen}</td>
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        active
                          ? "border border-[#2f9b7a] bg-[#122521] text-[#5ef1b5]"
                          : "border border-[#70551f] bg-[#241b09] text-[#ffb224]",
                      )}
                    >
                      {active ? "Active" : "Offline"}
                    </span>
                    {blocked ? (
                      <span className="ml-2 rounded-full border border-[#70551f] bg-[#241109] px-3 py-1 text-xs font-semibold text-[#ff8ba7]">
                        Blocked
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">{profile.is_private ? "Private" : "Public"}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <form action={formAction} className="flex items-center gap-2">
                        <input type="hidden" name="venueId" value={venueId} />
                        <input type="hidden" name="profileId" value={profile.id} />
                        <input type="hidden" name="action" value="block" />
                        <select
                          name="duration"
                          className="rounded-xl border border-[#223253] bg-transparent px-2 py-1 text-xs text-white"
                        >
                          <option value="1h">1 hr</option>
                          <option value="24h">24 hrs</option>
                          <option value="7d">7 days</option>
                          <option value="permanent">Permanent</option>
                        </select>
                        <input
                          type="text"
                          name="reason"
                          placeholder="Reason"
                          className="w-32 rounded-xl border border-[#223253] bg-transparent px-2 py-1 text-xs text-white"
                        />
                        <button
                          type="submit"
                          className="rounded-xl border border-[#553432] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7]"
                        >
                          Block
                        </button>
                      </form>
                      <form action={formAction}>
                        <input type="hidden" name="venueId" value={venueId} />
                        <input type="hidden" name="profileId" value={profile.id} />
                        <input type="hidden" name="action" value="unblock" />
                        <button
                          type="submit"
                          className="rounded-xl border border-[#2f9b7a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5]"
                        >
                          Unblock
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

