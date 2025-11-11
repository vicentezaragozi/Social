"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { setupVenueAction, type VenueSetupState } from "@/app/(auth)/sign-in/admin/onboarding/actions";

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
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-gradient-to-r from-[#6b9eff] to-[#4a7fd9] px-8 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving..." : "Continue to Session Setup"}
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
        <h1 className="mb-3 text-4xl font-bold text-white">Welcome to Social! 🎉</h1>
        <p className="text-lg text-[var(--muted)]">
          Let's set up your venue. This information will be visible to guests.
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
              Venue Name *
            </label>
            <input
              type="text"
              name="venueName"
              required
              value={draft.venueName}
              onChange={(event) => onDraftChange({ venueName: event.target.value })}
              placeholder="e.g., The Night Owl"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={draft.description}
              onChange={(event) => onDraftChange({ description: event.target.value })}
              placeholder="Tell guests about your venue's vibe..."
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Venue Logo
            </label>
            {draft.logoPreview && (
              <div className="mb-3 flex justify-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1024]">
                  <Image
                    src={draft.logoPreview}
                    alt="Logo preview"
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
              {draft.logoFilename ?? (draft.logoPreview ? "Existing logo" : "No file chosen")}
            </p>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={draft.address}
              onChange={(event) => onDraftChange({ address: event.target.value })}
              placeholder="123 Main St, City, State"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Capacity
            </label>
            <input
              type="number"
              name="capacity"
              min="1"
              value={draft.capacity}
              onChange={(event) => onDraftChange({ capacity: event.target.value })}
              placeholder="200"
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
                ← Back
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

