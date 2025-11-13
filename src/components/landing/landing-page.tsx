"use client";

import Image from "next/image";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {useState} from "react";

import {Link} from "@/i18n";
import {LanguageToggle} from "@/components/global/language-toggle";
import {SocialWordmark} from "@/components/brand/social-wordmark";

type Venue = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  address: string | null;
};

type LandingPageProps = {
  venues: Venue[];
};

export function LandingPage({ venues }: LandingPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [showQrInstructions, setShowQrInstructions] = useState(false);
  const tHeadline = useTranslations("landing.headline");
  const tVenueSelector = useTranslations("landing.venueSelector");
  const tQr = useTranslations("landing.qrSection");
  const tActions = useTranslations("common.actions");
  const tMessages = useTranslations("common.messages");
  const tLinks = useTranslations("common.links");

  const handleContinue = () => {
    if (!selectedVenue) return;
    
    // Redirect to sign-in with venue parameter
    router.push(`/${locale}/sign-in?venue=${selectedVenue}`);
  };

  const selectedVenueData = venues.find((v) => v.id === selectedVenue);

  return (
    <>
      {showQrInstructions ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="absolute right-6 top-6">
            <button
              type="button"
              onClick={() => setShowQrInstructions(false)}
              className="rounded-full border border-white/30 bg-black/60 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
            >
              {tActions("close")}
            </button>
          </div>
          <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-[#0a1024]/95 p-8 text-center shadow-2xl shadow-black/40">
            <SocialWordmark className="justify-center text-white" />
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">{tQr("modalTitle")}</h2>
              <p className="text-sm text-[var(--muted)]">
                {tQr("modalDescription")}
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-white/20 bg-[#101b33] px-4 py-6 text-sm text-[var(--muted)]">
              <p className="font-semibold text-white">{tQr("quickTips")}</p>
              <ul className="mt-3 space-y-2 text-left text-xs text-white/70">
                <li>{`\u2022 ${tQr("tipBrightness")}`}</li>
                <li>{`\u2022 ${tQr("tipBrowser")}`}</li>
                <li>{`\u2022 ${tQr("tipHelp")}`}</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-screen bg-[var(--background)] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[rgba(10,16,36,0.9)] px-6 py-6 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-4">
          <SocialWordmark className="flex-1 text-center tracking-[0.6em]" />
          <LanguageToggle className="shrink-0" />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              {tHeadline("title")}
            </h1>
            <p className="text-lg text-[var(--muted)]">
              {tHeadline("subtitle")}
            </p>
          </div>

          {/* Venue Selector */}
          <div className="rounded-3xl border border-[#223253] bg-[#0d162a] p-8 shadow-lg shadow-black/25">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">{tVenueSelector("title")}</h2>
                <p className="text-sm text-[var(--muted)]">
                  {tVenueSelector("subtitle")}
                </p>
              </div>

              {venues.length > 0 ? (
                <div className="space-y-3">
                  {venues.map((venue) => (
                    <button
                      key={venue.id}
                      onClick={() => setSelectedVenue(venue.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedVenue === venue.id
                          ? "border-[var(--accent)] bg-[var(--accent)]/10"
                          : "border-[#223253] bg-[#101b33] hover:border-[var(--accent)]/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {venue.logo_url ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[#223253]">
                            <Image
                              src={venue.logo_url}
                              alt={venue.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#223253] bg-[#0d162a] text-xl">
                            🎉
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{venue.name}</h3>
                          {venue.address && (
                            <p className="text-xs text-[var(--muted)]">{venue.address}</p>
                          )}
                        </div>
                        {selectedVenue === venue.id && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]">
                            <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#2e3a5d] bg-[#101b33] p-8 text-center">
                  <div className="mb-3 text-4xl">🏢</div>
                  <p className="text-sm text-[var(--muted)]">
                    {tMessages("noVenues")}
                  </p>
                </div>
              )}

              {selectedVenue && selectedVenueData && (
                <button
                  onClick={handleContinue}
                  className="w-full rounded-2xl bg-[var(--accent)] px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--accent-strong)]"
                >
                  {tVenueSelector("button")}
                </button>
              )}
            </div>
          </div>

          {/* QR Code Scanner Section */}
          <div className="rounded-3xl border border-[#223253] bg-[#0d162a] p-8 shadow-lg shadow-black/25">
            <div className="space-y-4 text-center">
              <h2 className="mb-2 text-xl font-semibold">{tQr("title")}</h2>
              <p className="text-sm text-[var(--muted)]">
                {tQr("subtitle")}
              </p>
              <button
                onClick={() => setShowQrInstructions(true)}
                className="w-full rounded-2xl border border-[#223253] bg-[#101b33] px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-[var(--accent)] hover:bg-[#0d162a]"
              >
                {tQr("openButton")}
              </button>
              <p className="text-xs text-[var(--muted)]">
                {tQr("footer")}
              </p>
            </div>
          </div>

          {/* Admin Sign In Link */}
          <div className="text-center">
            <Link
              href="/sign-in/admin"
              className="text-sm text-[var(--muted)] underline decoration-dotted underline-offset-4 transition hover:text-white"
            >
              {tLinks("adminSignIn")}
            </Link>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}

