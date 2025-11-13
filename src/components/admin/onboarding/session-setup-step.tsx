"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { setupSessionAction, type SessionSetupState } from "@/app/[locale]/(auth)/sign-in/admin/onboarding/actions";

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
  const t = useTranslations("admin.onboarding.session.actions");
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-gradient-to-r from-[#6b9eff] to-[#4a7fd9] px-8 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? t("creating") : t("continue")}
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
  const t = useTranslations("admin.onboarding.session");
  const tFields = useTranslations("admin.onboarding.session.fields");
  const tDuration = useTranslations("admin.onboarding.session.durationOptions");
  const tTypes = useTranslations("admin.onboarding.session.sessionTypes");
  const tInfo = useTranslations("admin.onboarding.session.infoBox");
  const tActions = useTranslations("admin.onboarding.session.actions");

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
        <h1 className="mb-3 text-4xl font-bold text-white">{t("title")}</h1>
        <p className="text-lg text-[var(--muted)]">
          {t("description", { venueName })}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0f1629]/80 p-8 backdrop-blur">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="venueId" value={venueId} />

          {/* Session Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("sessionName")} *
            </label>
            <input
              type="text"
              name="sessionName"
              required
              value={draft.sessionName}
              onChange={(event) => onDraftChange({ sessionName: event.target.value })}
              placeholder={tFields("sessionNamePlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("description")}
            </label>
            <textarea
              name="sessionDescription"
              rows={3}
              value={draft.sessionDescription}
              onChange={(event) => onDraftChange({ sessionDescription: event.target.value })}
              placeholder={tFields("descriptionPlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("duration")} *
            </label>
            <select
              name="durationHours"
              required
              value={draft.durationHours}
              onChange={(event) => onDraftChange({ durationHours: event.target.value })}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            >
              <option value="1">{tDuration("1")}</option>
              <option value="2">{tDuration("2")}</option>
              <option value="3">{tDuration("3")}</option>
              <option value="4">{tDuration("4")}</option>
              <option value="6">{tDuration("6")}</option>
              <option value="8">{tDuration("8")}</option>
              <option value="12">{tDuration("12")}</option>
              <option value="24">{tDuration("24")}</option>
              <option value="48">{tDuration("48")}</option>
              <option value="72">{tDuration("72")}</option>
              <option value="168">{tDuration("168")}</option>
            </select>
            <p className="text-xs text-[var(--muted)]">
              {t("durationHelp")}
            </p>
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("sessionType")}
            </label>
            <select
              name="sessionType"
              value={draft.sessionType}
              onChange={(event) =>
                onDraftChange({ sessionType: event.target.value as SessionDraft["sessionType"] })
              }
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            >
              <option value="event">{tTypes("event")}</option>
              <option value="daily">{tTypes("daily")}</option>
              <option value="weekly">{tTypes("weekly")}</option>
              <option value="custom">{tTypes("custom")}</option>
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
                {tActions("back")}
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
        <h3 className="mb-2 font-semibold text-[#6b9eff]">{tInfo("title")}</h3>
        <ul className="space-y-2 text-sm text-[var(--muted)]">
          <li>• {tInfo("points.1")}</li>
          <li>• {tInfo("points.2")}</li>
          <li>• {tInfo("points.3")}</li>
          <li>• {tInfo("points.4")}</li>
        </ul>
      </div>
    </div>
  );
}

