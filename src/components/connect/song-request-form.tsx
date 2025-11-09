"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";

import {
  submitSongRequest,
  type SongRequestState,
} from "@/app/(app)/requests/actions";
import { cn } from "@/lib/utils";

const initialState: SongRequestState = {};

export function SongRequestForm({
  venueId,
  currentSongsCount,
}: {
  venueId: string;
  currentSongsCount: number;
}) {
  const [state, formAction] = useFormState(submitSongRequest, initialState);

  useEffect(() => {
    if (state.success && state.whatsappUrl) {
      window.open(state.whatsappUrl, "_blank");
    }
  }, [state.success, state.whatsappUrl]);

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/25"
    >
      <input type="hidden" name="venueId" value={venueId} />
      <div className="space-y-2">
        <label
          htmlFor="song"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          Song title
        </label>
        <input
          id="song"
          name="song"
          required
          placeholder="Track name"
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="artist"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          Artist <span className="text-[var(--muted)]">(optional)</span>
        </label>
        <input
          id="artist"
          name="artist"
          placeholder="Who performs it?"
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="note"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          Dedication or vibe (optional)
        </label>
        <textarea
          id="note"
          name="note"
          maxLength={200}
          rows={3}
          placeholder="Ring in the chorus at midnight!"
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        <p className="text-xs text-[var(--muted)]">{currentSongsCount} requests tonight</p>
      </div>
      <button
        type="submit"
        className={cn(
          "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
        )}
      >
        <span className="relative z-10">Send via WhatsApp</span>
        <div className="absolute inset-0 translate-y-full bg-[var(--accent-strong)] transition group-hover:translate-y-0" />
      </button>
      {state.error ? (
        <p className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-2 text-xs text-[#ff8ba7]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-2xl border border-[#264b3f] bg-[#122521] px-4 py-2 text-xs text-[#5ef1b5]">
          Opening WhatsApp… if it didn&apos;t open, tap the button again.
        </p>
      ) : null}
    </form>
  );
}

