"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { Database } from "@/lib/supabase/types";
import type { UpdateUserState } from "@/app/admin/users/actions";
import { cn } from "@/lib/utils";

type GuestEntry = {
  profile: Database["public"]["Tables"]["profiles"]["Row"];
  sessions: Database["public"]["Tables"]["venue_sessions"]["Row"][];
};

const initialState: UpdateUserState = {};

const DURATION_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "permanent", label: "Permanent" },
];

function BlockDurationPicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selected = DURATION_OPTIONS.find((option) => option.value === value) ?? DURATION_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (optionValue: string) => {
    setValue(optionValue);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border border-[#553ed8]/40 bg-[#1a1f3d] px-3 py-2 text-xs font-medium text-[#c5c9ff] shadow-inner shadow-black/20 transition hover:border-[#6d5dff] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#6d5dff]/40 sm:text-sm"
      >
        <span>{selected.label}</span>
        <span className="text-[#9da3ff]">▾</span>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-40 overflow-hidden rounded-xl border border-[#553ed8]/50 bg-[#10142d] shadow-lg shadow-black/30"
        >
          {DURATION_OPTIONS.map((option) => {
            const isActive = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs sm:text-sm ${
                    isActive
                      ? "bg-[#2a2f58] text-white"
                      : "text-[#c5c9ff] hover:bg-[#24294d] hover:text-white"
                  }`}
                >
                  {option.label}
                  {isActive ? <span className="text-[#6d5dff]">●</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

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
                {blocked ? (
                  <form action={formAction} className="flex items-center gap-2">
                    <input type="hidden" name="venueId" value={venueId} />
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="action" value="unblock" />
                    <button
                      type="submit"
                      className="rounded-xl border border-[#2f9b7a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5ef1b5] transition hover:border-[#5ef1b5] hover:text-white"
                    >
                      Unblock
                    </button>
                  </form>
                ) : (
                  <form action={formAction} className="flex flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="venueId" value={venueId} />
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="action" value="block" />
                    <BlockDurationPicker name="duration" defaultValue="permanent" />
                    <input
                      type="text"
                      name="reason"
                      placeholder="Reason"
                      className="flex-1 rounded-xl border border-[#553ed8]/30 bg-[#141830] px-3 py-2 text-xs text-white placeholder:text-[#666d99] transition focus:border-[#6d5dff] focus:outline-none focus:ring-2 focus:ring-[#6d5dff]/40 sm:text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-xl border border-[#553432] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff8ba7] transition hover:border-[#ff8ba7] hover:text-white"
                    >
                      Block
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

