"use client";

import Image from "next/image";
import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";

import {
  activateSessionAction,
  deactivateSessionAction,
  updateSessionSettingsAction,
  updateVenueSettingsAction,
  type SessionSettingsState,
  type SessionToggleState,
  type VenueSettingsState,
} from "@/app/[locale]/admin/settings/actions";
import { MAX_GALLERY_ITEMS } from "@/components/admin/settings/constants";
import { SocialWordmark } from "@/components/brand/social-wordmark";
import { toDataURL } from "qrcode";

type VenueDetails = {
  id: string;
  name: string;
  slug: string;
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
  const tVenue = useTranslations("admin.settings.venue.actions");
  const tSession = useTranslations("admin.settings.session.actions");
  // Determine which translation to use based on label
  const savingText = label.includes("venue") || label.includes("Venue") 
    ? tVenue("saving") 
    : tSession("saving");
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-gradient-to-r from-[#6b9eff] to-[#4a7fd9] px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? savingText : label}
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
  const t = useTranslations("admin.settings.tabs");

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
          {t("venueCustomization")}
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
          {t("sessionConfiguration")}
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
  const [signInUrl, setSignInUrl] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [showFullscreenQr, setShowFullscreenQr] = useState(false);
  const t = useTranslations("admin.settings.venue");
  const tFields = useTranslations("admin.settings.venue.fields");
  const tQr = useTranslations("admin.settings.venue.qr");
  const tActions = useTranslations("admin.settings.venue.actions");
  const tMessages = useTranslations("admin.settings.venue.messages");

  useEffect(() => {
    if (state.success) {
      // Nothing to do; page will refetch via revalidate
    }
  }, [state.success]);

  useEffect(() => {
    if (typeof window === "undefined" || !venue.id) {
      setSignInUrl("");
      return;
    }

    setSignInUrl(`${window.location.origin}/sign-in?venue=${venue.id}`);
  }, [venue.id]);

  useEffect(() => {
    setQrDataUrl(null);
    setShowFullscreenQr(false);
    setQrError(null);
  }, [signInUrl]);

  const amenitiesValue = useMemo(
    () => (venue.amenities ?? []).join(", "),
    [venue.amenities],
  );

  const generateQr = useCallback(async (): Promise<string | null> => {
    if (!signInUrl) {
      setQrError(tQr("venueLinkUnavailable"));
      return null;
    }

    setIsGeneratingQr(true);
    setQrError(null);

    try {
      const dataUrl = await toDataURL(signInUrl, {
        margin: 2,
        width: 600,
        color: {
          dark: "#0a1024",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error("Failed to generate QR code", error);
      setQrError(tQr("qrError"));
      return null;
    } finally {
      setIsGeneratingQr(false);
    }
  }, [signInUrl]);

  const handleDownloadQr = useCallback(() => {
    if (!qrDataUrl) return;
    const downloadLink = document.createElement("a");
    downloadLink.href = qrDataUrl;
    downloadLink.download = `social-${venue.slug || venue.id}-qr.png`;
    downloadLink.rel = "noopener";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }, [qrDataUrl, venue.id, venue.slug]);

  const handleDisplayFullscreen = useCallback(async () => {
    if (!qrDataUrl) {
      const generated = await generateQr();
      if (!generated) {
        return;
      }
    }

    setShowFullscreenQr(true);
  }, [generateQr, qrDataUrl]);

  const handleCloseFullscreen = useCallback(() => {
    setShowFullscreenQr(false);
  }, []);

  const handleRemoveGallery = (url: string) => {
    setGallery((prev) => prev.filter((entry) => entry !== url));
  };

  return (
    <>
      {showFullscreenQr && qrDataUrl ? (
        <div className="fixed inset-0 z-50 flex min-h-screen w-screen items-center justify-center bg-black/90 px-4 py-6">
          <div className="absolute right-6 top-6">
            <button
              type="button"
              onClick={handleCloseFullscreen}
              className="rounded-full border border-white/30 bg-black/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/60"
            >
              Close
            </button>
          </div>

          <div className="w-full max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-[#0a1024]/95 p-10 text-center shadow-2xl shadow-black/40">
            <SocialWordmark className="justify-center text-white" />
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">{tQr("scanTitle", { venueName: venue.name })}</h2>
              <p className="text-sm text-[var(--muted)]">
                {tQr("scanDescription", { venueName: venue.name })}
              </p>
            </div>
            <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-3xl border border-white/20 bg-white p-6">
              <img src={qrDataUrl} alt={`QR code for ${venue.name}`} className="h-full w-full object-contain" />
            </div>
            {signInUrl ? (
              <p className="text-xs text-white/60">
                {tQr("orVisit")}{" "}
                <span className="break-all font-semibold text-white">
                  {signInUrl}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-6 rounded-3xl border border-[#1f2c49] bg-[#0d162a]/80 p-8 shadow-lg shadow-black/30">
        <div>
        <h2 className="text-2xl font-semibold text-white">{t("title")}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t("description")}
        </p>
      </div>

      {state.error && <ErrorNotice message={state.error} />}
      {state.success && <SuccessNotice message={tMessages("saved")} />}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="venueId" value={venue.id} />
        <input type="hidden" name="keepGalleryUrls" value={JSON.stringify(gallery)} />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("venueName")} *
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
              {tFields("capacity")}
            </label>
            <input
              type="number"
              name="capacity"
              min={0}
              defaultValue={venue.capacity ?? ""}
              placeholder={tFields("capacityPlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
            {tFields("description")}
          </label>
          <textarea
            name="description"
            rows={4}
            defaultValue={venue.description ?? ""}
            placeholder={tFields("descriptionPlaceholder")}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("address")}
            </label>
            <input
              name="address"
              defaultValue={venue.address ?? ""}
              placeholder={tFields("addressPlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("website")}
            </label>
            <input
              name="websiteUrl"
              defaultValue={venue.website_url ?? ""}
              placeholder={tFields("websitePlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("instagram")}
            </label>
            <input
              name="instagramHandle"
              defaultValue={venue.instagram_handle ?? ""}
              placeholder={tFields("instagramPlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("phoneNumber")}
            </label>
            <input
              name="phoneNumber"
              defaultValue={venue.phone_number ?? ""}
              placeholder={tFields("phonePlaceholder")}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
            {tFields("amenities")}
          </label>
          <input
            name="amenities"
            defaultValue={amenitiesValue}
            placeholder={tFields("amenitiesPlaceholder")}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FileUploadField
            label={tFields("venueLogo")}
            name="logo"
            description={tFields("logoDescription")}
          />
          <FileUploadField
            label={tFields("coverImage")}
            name="coverImage"
            description={tFields("coverDescription")}
          />
        </div>

        {venue.logo_url ? (
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10">
              <Image src={venue.logo_url} alt="Venue logo" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{tFields("currentLogo")}</p>
              <p className="text-xs text-[var(--muted)]">{tFields("replaceLogo")}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{tFields("venueGallery")}</h3>
              <p className="text-xs text-[var(--muted)]">
                {tFields("galleryDescription", { max: MAX_GALLERY_ITEMS })}
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-white/20 px-4 py-2 text-sm text-[var(--muted)] transition hover:border-white/40 hover:text-white">
              {tFields("uploadImages")}
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
                    {tFields("remove")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-10 text-center text-sm text-[var(--muted)]">
              <p>{tFields("noGalleryImages")}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <FormSubmitButton label={tActions("save")} />
        </div>
      </form>
        <div className="space-y-4 rounded-2xl border border-[#1a3a5a] bg-[#0f1f33] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{tQr("title")}</h3>
              <p className="text-xs text-[var(--muted)]">
                {tQr("description")}
              </p>
            </div>
          <button
              type="button"
              onClick={() => {
                void generateQr();
              }}
            disabled={isGeneratingQr || !signInUrl}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#6b9eff] to-[#4a7fd9] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingQr ? tQr("generating") : qrDataUrl ? tQr("regenerate") : tQr("generate")}
            </button>
          </div>
          {qrError ? <ErrorNotice message={qrError} /> : null}
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex items-center justify-center rounded-3xl border border-dashed border-white/15 bg-[#101b33] p-6 lg:w-72">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code preview for ${venue.name}`}
                  className="h-56 w-56 rounded-2xl bg-white p-4 object-contain"
                />
              ) : (
                <div className="text-center text-xs text-[var(--muted)]">
                  {tQr("preview")}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
                className="inline-flex items-center justify-center rounded-2xl border border-[#1f2c49] bg-[#0a1024] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#345088] hover:bg-[#101c36] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tQr("download")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDisplayFullscreen();
                }}
                disabled={(!qrDataUrl && !signInUrl) || isGeneratingQr}
                className="inline-flex items-center justify-center rounded-2xl bg-[#1a2a48] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24365f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tQr("displayFullscreen")}
              </button>
              <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-[var(--muted)]">
                <p className="font-semibold text-white/80">{tQr("signInLink")}</p>
                <p className="mt-1 break-all">
                  {signInUrl || tQr("unavailable")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
  const t = useTranslations("admin.settings.session");
  const tFields = useTranslations("admin.settings.session.fields");
  const tDuration = useTranslations("admin.settings.session.durationOptions");
  const tTypes = useTranslations("admin.settings.session.sessionTypes");
  const tInfo = useTranslations("admin.settings.session.infoBox");
  const tActions = useTranslations("admin.settings.session.actions");
  const tMessages = useTranslations("admin.settings.session.messages");

  useEffect(() => {
    if (state.success) {
      // Nothing else to do; page revalidates after action
    }
  }, [state.success]);

  const durationOptions = [
    { value: 1, label: tDuration("1") },
    { value: 2, label: tDuration("2") },
    { value: 3, label: tDuration("3") },
    { value: 4, label: tDuration("4") },
    { value: 6, label: tDuration("6") },
    { value: 8, label: tDuration("8") },
    { value: 12, label: tDuration("12") },
    { value: 24, label: tDuration("24") },
    { value: 48, label: tDuration("48") },
    { value: 72, label: tDuration("72") },
    { value: 168, label: tDuration("168") },
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
        <h2 className="text-2xl font-semibold text-white">{t("title")}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t("description")}
        </p>
      </div>

      {state.error && <ErrorNotice message={state.error} />}
      {state.success && <SuccessNotice message={tMessages("saved")} />}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="venueId" value={venueId} />
        {session?.id ? <input type="hidden" name="sessionId" value={session.id} /> : null}

        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
            {tFields("sessionName")} *
          </label>
          <input
            name="sessionName"
            required
            defaultValue={session?.session_name ?? ""}
            placeholder={tFields("sessionNamePlaceholder")}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
            {tFields("sessionDescription")}
          </label>
          <textarea
            name="sessionDescription"
            rows={4}
            defaultValue={session?.session_description ?? ""}
            placeholder={tFields("sessionDescriptionPlaceholder")}
            className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("duration")} *
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
              {tFields("durationHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("sessionType")}
            </label>
            <select
              name="sessionType"
              defaultValue={session?.session_type ?? "event"}
              className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-white transition-colors focus:border-[#6b9eff] focus:outline-none focus:ring-2 focus:ring-[#6b9eff]/30"
            >
              <option value="event">{tTypes("event")}</option>
              <option value="daily">{tTypes("daily")}</option>
              <option value="weekly">{tTypes("weekly")}</option>
              <option value="custom">{tTypes("custom")}</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("entryFee")}
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                name="entryFee"
                min="0"
                step="0.01"
                defaultValue={entryFeeValue}
                placeholder={tFields("entryFeePlaceholder")}
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
              {tFields("entryFeeHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              {tFields("status")}
            </label>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white">
              {session?.is_active
                ? tFields("statusActive")
                : tFields("statusInactive")}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <FormSubmitButton label={tActions("save")} />
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
              {session.is_active ? tActions("deactivate") : tActions("activate")}
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
        <h3 className="mb-2 text-base font-semibold text-[#6b9eff]">{tInfo("title")}</h3>
        <ul className="space-y-2">
          <li>• {tInfo("points.1")}</li>
          <li>• {tInfo("points.2")}</li>
          <li>• {tInfo("points.3")}</li>
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
  const tMessages = useTranslations("admin.settings.session.messages");
  return (
    <div className="flex-1 space-y-2">
      {isActive ? (
        <>
          {deactivateState.error && <ErrorNotice message={deactivateState.error} />}
          {deactivateState.success && <SuccessNotice message={tMessages("deactivated")} />}
        </>
      ) : (
        <>
          {activateState.error && <ErrorNotice message={activateState.error} />}
          {activateState.success && <SuccessNotice message={tMessages("activated")} />}
        </>
      )}
    </div>
  );
}


