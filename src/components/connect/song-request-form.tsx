"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import {
  submitSongRequest,
  type SongRequestState,
} from "@/app/[locale]/(app)/requests/actions";
import { cn } from "@/lib/utils";
import { useFormStatePreservation } from "@/hooks/use-form-state-preservation";

const initialState: SongRequestState = {};

export function SongRequestForm({
  venueId,
  currentSongsCount,
}: {
  venueId: string;
  currentSongsCount: number;
}) {
  const t = useTranslations("app.requests.form");
  const tSuccess = useTranslations("app.requests.form.success");
  const [state, formAction] = useActionState(submitSongRequest, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Form state preservation across locale changes
  const { clearSavedState } = useFormStatePreservation(
    "song-request-form",
    null,
    null,
    { formRef }
  );

  useEffect(() => {
    if (state.success) {
      // Clear saved form state and reset form on successful submission
      clearSavedState();
      formRef.current?.reset();
    }
  }, [state.success, clearSavedState]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/25 sm:p-7"
    >
      <input type="hidden" name="venueId" value={venueId} />
      <div className="space-y-2">
        <label
          htmlFor="song"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          {t("songTitle")}
        </label>
        <input
          id="song"
          name="song"
          required
          placeholder={t("songPlaceholder")}
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="artist"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          {t("artist")} <span className="text-[var(--muted)]">{t("artistOptional")}</span>
        </label>
        <input
          id="artist"
          name="artist"
          placeholder={t("artistPlaceholder")}
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="note"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]"
        >
          {t("dedication")}
        </label>
        <textarea
          id="note"
          name="note"
          maxLength={200}
          rows={3}
          placeholder={t("dedicationPlaceholder")}
          className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        <p className="text-xs text-[var(--muted)]">{t("requestsTonight", { count: currentSongsCount })}</p>
      </div>
      <button
        type="submit"
        className={cn(
          "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
        )}
      >
        <span className="relative z-10">{t("submit")}</span>
        <div className="absolute inset-0 translate-y-full bg-[var(--accent-strong)] transition group-hover:translate-y-0" />
      </button>
      {state.error ? (
        <p className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-2 text-xs text-[#ff8ba7]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <div className="space-y-3 rounded-2xl border border-[#264b3f] bg-[#122521] p-4">
          <p className="text-sm font-semibold text-[#5ef1b5]">{tSuccess("title")}</p>
          <p className="text-xs text-[#7bc9a8]">{tSuccess("description")}</p>
          {state.whatsappUrl && (
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#264b3f] bg-[#0d1a16] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#5ef1b5] transition hover:border-[#5ef1b5] hover:bg-[#122521]"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {tSuccess("openWhatsApp")}
            </a>
          )}
        </div>
      ) : null}
    </form>
  );
}

