"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SocialWordmark } from "@/components/brand/social-wordmark";

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
  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleContinue = () => {
    if (!selectedVenue) return;
    
    // Redirect to sign-in with venue parameter
    router.push(`/sign-in?venue=${selectedVenue}`);
  };

  const selectedVenueData = venues.find((v) => v.id === selectedVenue);

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[rgba(10,16,36,0.9)] px-6 py-6 backdrop-blur-lg">
        <div className="mx-auto max-w-2xl">
          <SocialWordmark className="text-center tracking-[0.6em]" />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Welcome to Social
            </h1>
            <p className="text-lg text-[var(--muted)]">
              Connect with people at your venue tonight
            </p>
          </div>

          {/* Venue Selector */}
          <div className="rounded-3xl border border-[#223253] bg-[#0d162a] p-8 shadow-lg shadow-black/25">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Select Your Venue</h2>
                <p className="text-sm text-[var(--muted)]">
                  Choose the location where you&apos;re at tonight
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
                    No venues available at the moment.
                  </p>
                </div>
              )}

              {selectedVenue && selectedVenueData && (
                <button
                  onClick={handleContinue}
                  className="w-full rounded-2xl bg-[var(--accent)] px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--accent-strong)]"
                >
                  Continue to Sign In
                </button>
              )}
            </div>
          </div>

          {/* QR Code Scanner Section */}
          <div className="rounded-3xl border border-[#223253] bg-[#0d162a] p-8 shadow-lg shadow-black/25">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Have a QR Code?</h2>
                <p className="text-sm text-[var(--muted)]">
                  Scan the QR code at your venue to join instantly
                </p>
              </div>

              {!showQRScanner ? (
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="w-full rounded-2xl border border-[#223253] bg-[#101b33] px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-[var(--accent)] hover:bg-[#0d162a]"
                >
                  Open QR Scanner
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-square w-full rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[#101b33] p-8">
                    <div className="flex h-full flex-col items-center justify-center space-y-4">
                      <svg className="h-24 w-24 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <p className="text-center text-sm text-[var(--muted)]">
                        QR scanner will be implemented here
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        For now, use the venue selector above
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQRScanner(false)}
                    className="w-full rounded-2xl border border-[#5c2a40] bg-[#301321] px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#ff8ba7] transition hover:border-[#ff8ba7]"
                  >
                    Close Scanner
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Admin Sign In Link */}
          <div className="text-center">
            <Link
              href="/sign-in/admin"
              className="text-sm text-[var(--muted)] underline decoration-dotted underline-offset-4 transition hover:text-white"
            >
              Venue staff? Sign in here
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

