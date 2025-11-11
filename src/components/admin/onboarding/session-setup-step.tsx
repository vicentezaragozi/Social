"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { setupSessionAction, type SessionSetupState } from "@/app/(auth)/sign-in/admin/onboarding/actions";

type SessionDraft = {
  sessionName: string;
  sessionDescription: string;
  durationHours: string;
  sessionType: "event" | "daily" | "weekly" | "custom";
};

type SessionSetupStepProps = {
  venueId: string;
  venueName: string;
  onComplete: (draft: SessionDraft) => void;
  onBack: () => void;
  canGoBack: boolean;
  draft: SessionDraft;
  onDraftChange: (updates: Partial<SessionDraft>) => void;
};

const initialState: SessionSetupState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-gradient-to-r from-[#6b9eff] to-[#4a7fd9] px-8 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Creating Session..." : "Continue to Profile Setup"}
    </button>
  );
}

export function SessionSetupStep({
  venueId,
  venueName,
  onComplete,
  onBack,
  canGoBack,
  draft,
  onDraftChange,
}: SessionSetupStepProps) {
  const [state, formAction] = useActionState(setupSessionAction, initialState);

  // If setup is successful, call onComplete
  useEffect(() => {
    if (state.success) {
      if (state.metadata) {
        onComplete({
          sessionName: state.metadata.session_name,
          sessionDescription: state.metadata.session_description ?? "",
          durationHours: String(state.metadata.duration_hours),
          sessionType: state.metadata.session_type,
        });
      } else {
        onComplete(draft);
      }
    }
  }, [state.success, state.metadata, onComplete, draft]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-3 text-4xl font-bold text-white">Configure Your Session ⏰</h1>
        <p className="text-lg text-[var(--muted)]">
          Set up how long guests can connect at {venueName}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0f1629]/80 p-8 backdrop-blur">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="venueId" value={venueId} />

          {/* Session Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Session Name *
            </label>
            <input
              type="text"
              name="sessionName"
              required
              value={draft.sessionName}
              onChange={(event) => onDraftChange({ sessionName: event.target.value })}
              placeholder="e.g., Friday Night Vibes"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Description
            </label>
            <textarea
              name="sessionDescription"
              rows={3}
              value={draft.sessionDescription}
              onChange={(event) => onDraftChange({ sessionDescription: event.target.value })}
              placeholder="What's special about tonight?"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Duration (hours) *
            </label>
            <select
              name="durationHours"
              required
              value={draft.durationHours}
              onChange={(event) => onDraftChange({ durationHours: event.target.value })}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="8">8 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours (1 day)</option>
              <option value="48">48 hours (2 days)</option>
              <option value="72">72 hours (3 days)</option>
              <option value="168">168 hours (1 week)</option>
            </select>
            <p className="text-xs text-[var(--muted)]">
              Minimum 1 hour, maximum 1 week. After the session ends, guest accounts will be deactivated.
            </p>
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Session Type
            </label>
            <select
              name="sessionType"
              value={draft.sessionType}
              onChange={(event) =>
                onDraftChange({ sessionType: event.target.value as SessionDraft["sessionType"] })
              }
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            >
              <option value="event">Special Event</option>
              <option value="daily">Daily Session</option>
              <option value="weekly">Weekly Session</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {state.error && (
            <div className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-3 text-sm text-[#ff8ba7]">
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            {canGoBack ? (
              <button
                type="button"
                onClick={onBack}
                className="rounded-2xl border border-white/10 px-6 py-4 font-semibold text-white transition-colors hover:bg-white/5"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            <SubmitButton />
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="rounded-2xl border border-[#1a3a5a] bg-[#0f1f33] p-6">
        <h3 className="mb-2 font-semibold text-[#6b9eff]">💡 How Sessions Work</h3>
        <ul className="space-y-2 text-sm text-[var(--muted)]">
          <li>• Guests can only connect during active sessions</li>
          <li>• After a session ends, guest accounts are automatically deactivated</li>
          <li>• You can create a new session anytime from the admin dashboard</li>
          <li>• Each venue can have only one active session at a time</li>
        </ul>
      </div>
    </div>
  );
}

