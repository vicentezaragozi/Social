"use client";

import { useActionState } from "react";

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
  const [state, formAction] = useActionState(action, initialState);

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

      <div className="space-y-4">
        {guests.map(({ profile, sessions }) => {
          const active = sessions.some(
            (session) => session.status === "active" && !session.exited_at,
          );
          const lastSeen = profile.last_seen_at
            ? new Date(profile.last_seen_at).toLocaleString()
            : "Unknown";
          const blocked = Boolean(profile.blocked_until);

          return (
            <div
              key={profile.id}
              className="space-y-4 rounded-3xl border border-[#223253] bg-[#0d162a] p-4 shadow-lg shadow-black/25 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-white sm:text-lg">
                    {profile.display_name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{lastSeen}</p>
                  {profile.blocked_reason ? (
                    <p className="text-xs text-[#ff8ba7]">Reason: {profile.blocked_reason}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
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
                    <span className="rounded-full border border-[#553432] bg-[#241109] px-3 py-1 text-xs font-semibold text-[#ff8ba7]">
                      Blocked
                    </span>
                  ) : null}
                  <span className="rounded-full border border-[#223253] px-3 py-1 text-xs text-[var(--muted)]">
                    {profile.is_private ? "Private" : "Public"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <form action={formAction} className="flex flex-1 items-center gap-2">
                  <input type="hidden" name="venueId" value={venueId} />
                  <input type="hidden" name="profileId" value={profile.id} />
                  <input type="hidden" name="action" value="block" />
                  <input
                    type="text"
                    name="reason"
                    placeholder="Reason"
                    className="flex-1 rounded-xl border border-[#223253] bg-transparent px-2 py-1 text-xs text-white sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-[#553432] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7]"
                  >
                    Block
                  </button>
                </form>
                <form
                  action={formAction}
                  className="flex items-center"
                >
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
            </div>
          );
        })}
      </div>
    </section>
  );
}

