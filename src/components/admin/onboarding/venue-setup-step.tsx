"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { setupVenueAction, type VenueSetupState } from "@/app/[locale]/(auth)/sign-in/admin/onboarding/actions";

type Venue = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  capacity: number | null;
} | null;

type VenueSetupStepProps = {
  venue: Venue;
  onComplete: (venue: Venue) => void;
  onSubmitSuccess?: (venue: NonNullable<Venue>) => void;
  onBack: (() => void) | null;
  canGoBack: boolean;
  draft: {
    venueName: string;
    description: string;
    address: string;
    capacity: string;
    logoPreview: string | null;
    logoDataUrl: string | null;
    logoFilename: string | null;
  };
  onDraftChange: (
    updates: Partial<{
      venueName: string;
      description: string;
      address: string;
      capacity: string;
      logoPreview: string | null;
      logoDataUrl: string | null;
      logoFilename: string | null;
    }>,
  ) => void;
};

const initialState: VenueSetupState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("admin.onboarding.venue.actions");
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-gradient-to-r from-[#6b9eff] to-[#4a7fd9] px-8 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? t("saving") : t("continue")}
    </button>
  );
}

export function VenueSetupStep({
  venue,
  onComplete,
  onSubmitSuccess,
  onBack,
  canGoBack,
  draft,
  onDraftChange,
}: VenueSetupStepProps) {
  const [state, formAction] = useActionState(setupVenueAction, initialState);
  const t = useTranslations("admin.onboarding.venue");
  const tFields = useTranslations("admin.onboarding.venue.fields");
  const tFileStatus = useTranslations("admin.onboarding.venue.fileStatus");
  const tActions = useTranslations("admin.onboarding.venue.actions");

  // If setup is successful, call onComplete
  useEffect(() => {
    if (state.success && state.venue) {
      onComplete(state.venue);
      onSubmitSuccess?.(state.venue);
    }
  }, [state.success, state.venue, onComplete, onSubmitSuccess]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onDraftChange({
          logoPreview: reader.result as string,
          logoDataUrl: reader.result as string,
          logoFilename: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-3 text-4xl font-bold text-white">{t("title")}</h1>
        <p className="text-lg text-[var(--muted)]">
          {t("description")}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0f1629]/80 p-8 backdrop-blur">
        <form action={formAction} className="space-y-6">
          {venue && <input type="hidden" name="venueId" value={venue.id} />}
          {draft.logoDataUrl && (
            <>
              <input type="hidden" name="logoDataUrl" value={draft.logoDataUrl} />
              {draft.logoFilename && (
                <input type="hidden" name="logoFilename" value={draft.logoFilename} />
              )}
            </>
          )}

          {/* Venue Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("venueName")} *
            </label>
            <input
              type="text"
              name="venueName"
              required
              value={draft.venueName}
              onChange={(event) => onDraftChange({ venueName: event.target.value })}
              placeholder={tFields("venueNamePlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("description")}
            </label>
            <textarea
              name="description"
              rows={4}
              value={draft.description}
              onChange={(event) => onDraftChange({ description: event.target.value })}
              placeholder={tFields("descriptionPlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("logo")}
            </label>
            {draft.logoPreview && (
              <div className="mb-3 flex justify-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1024]">
                  <Image
                    src={draft.logoPreview}
                    alt={tFields("logoPreview")}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            )}
            <input
              type="file"
              name="logo"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white file:mr-4 file:rounded-xl file:border-0 file:bg-[#1a2a4a] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#6b9eff] hover:file:bg-[#243556]"
            />
            <p className="mt-2 text-xs text-white/70">
              {draft.logoFilename ?? (draft.logoPreview ? tFileStatus("existing") : tFileStatus("noFile"))}
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("address")}
            </label>
            <input
              type="text"
              name="address"
              value={draft.address}
              onChange={(event) => onDraftChange({ address: event.target.value })}
              placeholder={tFields("addressPlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("capacity")}
            </label>
            <input
              type="number"
              name="capacity"
              min="1"
              value={draft.capacity}
              onChange={(event) => onDraftChange({ capacity: event.target.value })}
              placeholder={tFields("capacityPlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {state.error && (
            <div className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-3 text-sm text-[#ff8ba7]">
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            {canGoBack && onBack ? (
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
    </div>
  );
}

