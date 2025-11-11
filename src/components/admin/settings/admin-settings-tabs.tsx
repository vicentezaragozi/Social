"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  activateSessionAction,
  deactivateSessionAction,
  updateSessionSettingsAction,
  updateVenueSettingsAction,
  type SessionSettingsState,
  type SessionToggleState,
  type VenueSettingsState,
} from "@/app/admin/settings/actions";
import { MAX_GALLERY_ITEMS } from "@/components/admin/settings/constants";

type VenueDetails = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  capacity: number | null;
  website_url: string | null;
  instagram_handle: string | null;
  phone_number: string | null;
  amenities: string[] | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
};

type SessionDetails = {
  id: string;
  session_name: string;
  session_description: string | null;
  session_type: "event" | "daily" | "weekly" | "custom";
  duration_hours: number;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
  entry_fee_cents: number | null;
  entry_fee_currency: string | null;
} | null;

type AdminSettingsTabsProps = {
  venue: VenueDetails;
  session: SessionDetails;
};

function FormSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-gradient-to-r from-[#6b9eff] to-[#4a7fd9] px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function SuccessNotice({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
      {message}
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  );
}

export function AdminSettingsTabs({ venue, session }: AdminSettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<"venue" | "session">("venue");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-3xl border border-[#1f2c49] bg-[#0d162a]/80 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("venue")}
          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "venue"
              ? "bg-[#1a2a48] text-white shadow-lg shadow-black/20"
              : "text-[var(--muted)] hover:text-white"
          }`}
        >
          Venue customization
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("session")}
          className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "session"
              ? "bg-[#1a2a48] text-white shadow-lg shadow-black/20"
              : "text-[var(--muted)] hover:text-white"
          }`}
        >
          Session configuration
        </button>
      </div>

      {activeTab === "venue" ? (
        <VenueSettingsPanel venue={venue} />
      ) : (
        <SessionSettingsPanel venueId={venue.id} session={session} />
      )}
    </div>
  );
}

function VenueSettingsPanel({ venue }: { venue: VenueDetails }) {
  const [state, formAction] = useActionState<VenueSettingsState, FormData>(
    updateVenueSettingsAction,
    {},
  );
  const [gallery, setGallery] = useState<string[]>(venue.gallery_urls ?? []);

  useEffect(() => {
    if (state.success) {
      // Nothing to do; page will refetch via revalidate
    }
  }, [state.success]);

  const amenitiesValue = useMemo(
    () => (venue.amenities ?? []).join(", "),
    [venue.amenities],
  );

  const handleRemoveGallery = (url: string) => {
    setGallery((prev) => prev.filter((entry) => entry !== url));
  };

  return (
    <div className="space-y-6 rounded-3xl border border-[#1f2c49] bg-[#0d162a]/80 p-8 shadow-lg shadow-black/30">
      <div>
        <h2 className="text-2xl font-semibold text-white">Venue customization</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Update guest-facing details, upload gallery shots, and manage your contact info.
        </p>
      </div>

      {state.error && <ErrorNotice message={state.error} />}
      {state.success && <SuccessNotice message="Venue settings saved." />}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="venueId" value={venue.id} />
        <input type="hidden" name="keepGalleryUrls" value={JSON.stringify(gallery)} />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Venue name *
            </label>
            <input
              name="venueName"
              required
              defaultValue={venue.name}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Capacity
            </label>
            <input
              type="number"
              name="capacity"
              min={0}
              defaultValue={venue.capacity ?? ""}
              placeholder="e.g., 200"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            defaultValue={venue.description ?? ""}
            placeholder="Tell guests about your vibe..."
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Address
            </label>
            <input
              name="address"
              defaultValue={venue.address ?? ""}
              placeholder="123 Main St, City"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Website
            </label>
            <input
              name="websiteUrl"
              defaultValue={venue.website_url ?? ""}
              placeholder="https://"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Instagram
            </label>
            <input
              name="instagramHandle"
              defaultValue={venue.instagram_handle ?? ""}
              placeholder="@yoursocialclub"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Phone number
            </label>
            <input
              name="phoneNumber"
              defaultValue={venue.phone_number ?? ""}
              placeholder="+1 555 555 5555"
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
            Amenities (comma separated)
          </label>
          <input
            name="amenities"
            defaultValue={amenitiesValue}
            placeholder="WiFi, Outdoor seating, VIP lounge"
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FileUploadField
            label="Venue logo"
            name="logo"
            description="Upload a square logo for guest lists and QR pages."
          />
          <FileUploadField
            label="Cover image"
            name="coverImage"
            description="Panoramic photo used for onboarding and settings previews."
          />
        </div>

        {venue.logo_url ? (
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10">
              <Image src={venue.logo_url} alt="Venue logo" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Current logo</p>
              <p className="text-xs text-[var(--muted)]">Upload a new file to replace it.</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Venue gallery</h3>
              <p className="text-xs text-[var(--muted)]">
                Share up to {MAX_GALLERY_ITEMS} highlights. Guests will see these on the landing page.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-white/20 px-4 py-2 text-sm text-[var(--muted)] transition hover:border-white/40 hover:text-white">
              Upload images
              <input type="file" name="galleryFiles" accept="image/*" multiple className="hidden" />
            </label>
          </div>

          {gallery.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((url) => (
                <div
                  key={url}
                  className="group relative overflow-hidden rounded-2xl border border-white/10"
                >
                  <div className="relative h-40 w-full">
                    <Image src={url} alt="Gallery image" fill className="object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveGallery(url)}
                    className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-sm text-[var(--muted)]">
              <p>No gallery images yet. Upload some to showcase your venue.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <FormSubmitButton label="Save venue settings" />
        </div>
      </form>
    </div>
  );
}

function FileUploadField({
  label,
  name,
  description,
}: {
  label: string;
  name: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
        {label}
      </label>
      <input
        type="file"
        name={name}
        accept="image/*"
        className="w-full rounded-2xl border border-dashed border-[#233050] bg-[#0a1024] px-5 py-4 text-white file:mr-4 file:rounded-xl file:border-0 file:bg-[#1a2a4a] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#6b9eff] hover:border-[#345088] hover:file:bg-[#243556]"
      />
      {description ? <p className="text-xs text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}

function SessionSettingsPanel({
  venueId,
  session,
}: {
  venueId: string;
  session: SessionDetails;
}) {
  const [state, formAction] = useActionState<SessionSettingsState, FormData>(
    updateSessionSettingsAction,
    {},
  );
  const [deactivateState, deactivateAction] = useActionState<SessionToggleState, FormData>(
    deactivateSessionAction,
    {},
  );
  const [activateState, activateAction] = useActionState<SessionToggleState, FormData>(
    activateSessionAction,
    {},
  );
  const [entryFeeCurrency, setEntryFeeCurrency] = useState(
    session?.entry_fee_currency ?? "USD",
  );

  useEffect(() => {
    if (state.success) {
      // Nothing else to do; page revalidates after action
    }
  }, [state.success]);

  const durationOptions = [
    { value: 1, label: "1 hour" },
    { value: 2, label: "2 hours" },
    { value: 3, label: "3 hours" },
    { value: 4, label: "4 hours" },
    { value: 6, label: "6 hours" },
    { value: 8, label: "8 hours" },
    { value: 12, label: "12 hours" },
    { value: 24, label: "24 hours (1 day)" },
    { value: 48, label: "48 hours (2 days)" },
    { value: 72, label: "72 hours (3 days)" },
    { value: 168, label: "168 hours (1 week)" },
  ];

  const entryFeeValue = useMemo(() => {
    if (typeof session?.entry_fee_cents === "number") {
      return (session.entry_fee_cents / 100).toFixed(2);
    }
    return "";
  }, [session?.entry_fee_cents]);

  return (
    <div className="space-y-6 rounded-3xl border border-[#1f2c49] bg-[#0d162a]/80 p-8 shadow-lg shadow-black/30">
      <div>
        <h2 className="text-2xl font-semibold text-white">Session configuration</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Session duration controls how long guests can stay connected. After the timer ends, all
          guests are returned to the landing page.
        </p>
      </div>

      {state.error && <ErrorNotice message={state.error} />}
      {state.success && <SuccessNotice message="Session settings saved." />}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="venueId" value={venueId} />
        {session?.id ? <input type="hidden" name="sessionId" value={session.id} /> : null}

        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
            Session name *
          </label>
          <input
            name="sessionName"
            required
            defaultValue={session?.session_name ?? ""}
            placeholder="Friday Night Vibes"
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
            Session description
          </label>
          <textarea
            name="sessionDescription"
            rows={4}
            defaultValue={session?.session_description ?? ""}
            placeholder="Highlight DJs, drink specials, or anything else guests should know."
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Duration *
            </label>
            <select
              name="durationHours"
              required
              defaultValue={session?.duration_hours ?? 4}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--muted)]">
              Minimum 1 hour, maximum 1 week. Guests will be signed out when this timer hits zero.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Session type
            </label>
            <select
              name="sessionType"
              defaultValue={session?.session_type ?? "event"}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            >
              <option value="event">Special event</option>
              <option value="daily">Daily session</option>
              <option value="weekly">Weekly session</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Entry fee
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                name="entryFee"
                min="0"
                step="0.01"
                defaultValue={entryFeeValue}
                placeholder="0.00"
                className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
              />
              <select
                name="entryFeeCurrency"
                value={entryFeeCurrency}
                onChange={(event) => setEntryFeeCurrency(event.target.value)}
                className="w-24 rounded-2xl border border-[#233050] bg-[#0a1024] px-3 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Leave blank if the session is free for guests.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              Status
            </label>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white">
              {session?.is_active
                ? "Active — guests are currently connected."
                : "Inactive — activate to let guests join."}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <FormSubmitButton label="Save session settings" />
        </div>
      </form>

      {session ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center sm:gap-2">
          <form
            action={session.is_active ? deactivateAction : activateAction}
            className="flex-shrink-0 sm:w-auto"
          >
            <input type="hidden" name="venueId" value={venueId} />
            <input type="hidden" name="sessionId" value={session.id} />
            <button
              type="submit"
              className={
                session.is_active
                  ? "w-full rounded-2xl bg-[#301321] px-8 py-3 text-sm font-semibold text-[#ff8ba7] transition hover:bg-[#3c1b2d] sm:w-auto"
                  : "w-full rounded-2xl bg-[#1a2a48] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#24365f] sm:w-auto"
              }
            >
              {session.is_active ? "Deactivate session" : "Activate session"}
            </button>
          </form>
          <SessionToggleMessages
            isActive={session.is_active}
            activateState={activateState}
            deactivateState={deactivateState}
          />
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#1a3a5a] bg-[#0f1f33] p-6 text-sm text-[var(--muted)]">
        <h3 className="mb-2 text-base font-semibold text-[#6b9eff]">How session timing works</h3>
        <ul className="space-y-2">
          <li>• Guests can only log in during an active session.</li>
          <li>• When the timer reaches zero, guests are redirected to the landing page.</li>
          <li>• QR codes and manual venue selection are blocked until a session is active again.</li>
        </ul>
      </div>
    </div>
  );
}

function SessionToggleMessages({
  isActive,
  activateState,
  deactivateState,
}: {
  isActive: boolean;
  activateState: SessionToggleState;
  deactivateState: SessionToggleState;
}) {
  return (
    <div className="flex-1 space-y-2">
      {isActive ? (
        <>
          {deactivateState.error && <ErrorNotice message={deactivateState.error} />}
          {deactivateState.success && <SuccessNotice message="Session deactivated." />}
        </>
      ) : (
        <>
          {activateState.error && <ErrorNotice message={activateState.error} />}
          {activateState.success && <SuccessNotice message="Session activated." />}
        </>
      )}
    </div>
  );
}


