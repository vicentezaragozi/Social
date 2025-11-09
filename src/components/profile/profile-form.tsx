"use client";

import { useFormState } from "react-dom";

import {
  updateProfileAction,
  type ProfileUpdateState,
} from "@/app/(app)/profile/actions";
import { cn } from "@/lib/utils";

const initialState: ProfileUpdateState = {};

export function ProfileForm({
  defaultValues,
  email,
}: {
  defaultValues: {
    display_name: string;
    bio: string | null;
    is_private: boolean;
  };
  email: string;
}) {
  const [state, formAction] = useFormState(updateProfileAction, initialState);

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/25"
    >
      <div className="space-y-2">
        <label
          htmlFor="display_name"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          required
          defaultValue={defaultValues.display_name}
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="bio"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          maxLength={240}
          rows={3}
          defaultValue={defaultValues.bio ?? ""}
          placeholder="Let people know your vibe."
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        <p className="text-xs text-[var(--muted)]">Shared when your profile is public.</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-[#223253] bg-[#101b33] p-4">
        <input
          id="is_private"
          name="is_private"
          type="checkbox"
          defaultChecked={defaultValues.is_private}
          className="mt-1 h-4 w-4 rounded border border-[#2b3a63] bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
        />
        <label htmlFor="is_private" className="space-y-1 text-sm">
          <span className="font-semibold text-white">Stay private by default</span>
          <p className="text-xs text-[var(--muted)]">
            When enabled, only people you reach out to can see your profile. Staff always have
            access for safety.
          </p>
        </label>
      </div>

      <div className="rounded-2xl border border-[#223253] bg-[#101b33] p-4 text-xs text-[var(--muted)]">
        <p>
          Magic link emails go to <span className="text-white">{email}</span>. Ask the staff if you
          need to update it.
        </p>
      </div>

      <button
        type="submit"
        className={cn(
          "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
        )}
      >
        <span className="relative z-10">Save profile</span>
        <div className="absolute inset-0 translate-y-full bg-[var(--accent-strong)] transition group-hover:translate-y-0" />
      </button>

      {state.error ? (
        <p className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-2 text-xs text-[#ff8ba7]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-2xl border border-[#264b3f] bg-[#122521] px-4 py-2 text-xs text-[#5ef1b5]">
          Profile updated. Your changes are live.
        </p>
      ) : null}
    </form>
  );
}

