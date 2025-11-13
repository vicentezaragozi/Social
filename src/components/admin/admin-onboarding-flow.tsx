"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n";
import { VenueSetupStep } from "./onboarding/venue-setup-step";
import { SessionSetupStep } from "./onboarding/session-setup-step";
import { AdminProfileStep } from "./onboarding/admin-profile-step";
import { SocialWordmark } from "@/components/brand/social-wordmark";
import { useFormStatePreservation } from "@/hooks/use-form-state-preservation";

type OnboardingStep = "venue" | "session" | "profile";

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

type Venue = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  capacity: number | null;
} | null;

type SessionMetadata =
  | {
      id: string;
      session_name: string;
      session_description: string | null;
      duration_hours: number;
      session_type: "event" | "daily" | "weekly" | "custom";
    }
  | null;

type VenueDraft = {
  venueName: string;
  description: string;
  address: string;
  capacity: string;
  logoPreview: string | null;
  logoDataUrl: string | null;
  logoFilename: string | null;
};

type SessionDraft = {
  sessionName: string;
  sessionDescription: string;
  durationHours: string;
  sessionType: "event" | "daily" | "weekly" | "custom";
};

type ProfileDraft = {
  displayName: string;
  bio: string;
  avatarPreview: string | null;
  avatarCroppedDataUrl: string | null;
  avatarFileName: string | null;
};

type AdminOnboardingFlowProps = {
  currentStep: OnboardingStep;
  profile: Profile;
  venue: Venue;
  sessionMetadata: SessionMetadata;
  userEmail: string;
};

export function AdminOnboardingFlow({
  currentStep: initialStep,
  profile,
  venue: initialVenue,
  sessionMetadata,
  userEmail,
}: AdminOnboardingFlowProps) {
  const router = useRouter();
  const locale = useLocale();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);
  const [venue, setVenue] = useState<Venue>(initialVenue);
  const [venueDraft, setVenueDraft] = useState<VenueDraft>({
    venueName: initialVenue?.name ?? "",
    description: initialVenue?.description ?? "",
    address: initialVenue?.address ?? "",
    capacity: initialVenue?.capacity ? String(initialVenue.capacity) : "",
    logoPreview: initialVenue?.logo_url ?? null,
    logoDataUrl: null,
    logoFilename: null,
  });
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>({
    sessionName: sessionMetadata?.session_name ?? "Tonight's Session",
    sessionDescription: sessionMetadata?.session_description ?? "",
    durationHours: sessionMetadata?.duration_hours
      ? String(sessionMetadata.duration_hours)
      : "24",
    sessionType: sessionMetadata?.session_type ?? "event",
  });
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    displayName: profile.display_name ?? "",
    bio: profile.bio ?? "",
    avatarPreview: profile.avatar_url,
    avatarCroppedDataUrl: null,
    avatarFileName: null,
  });

  const handleVenueDraftChange = (updates: Partial<VenueDraft>) => {
    setVenueDraft((prev) => ({ ...prev, ...updates }));
  };

  const handleSessionDraftChange = (updates: Partial<SessionDraft>) => {
    setSessionDraft((prev) => ({ ...prev, ...updates }));
  };

  const handleProfileDraftChange = (updates: Partial<ProfileDraft>) => {
    setProfileDraft((prev) => ({ ...prev, ...updates }));
  };

  // Form state preservation across locale changes
  const controlledState = {
    currentStep,
    venueDraft,
    sessionDraft,
    profileDraft,
  };

  const { clearSavedState } = useFormStatePreservation<typeof controlledState>(
    "admin-onboarding-form",
    controlledState,
    (restored: typeof controlledState) => {
      if (restored.currentStep !== undefined) setCurrentStep(restored.currentStep);
      if (restored.venueDraft !== undefined) setVenueDraft(restored.venueDraft);
      if (restored.sessionDraft !== undefined) setSessionDraft(restored.sessionDraft);
      if (restored.profileDraft !== undefined) setProfileDraft(restored.profileDraft);
    }
  );

  // Clear saved state when onboarding is complete (handled in AdminProfileStep)
  
  // Handler to go to next step
  const handleVenueComplete = (updatedVenue: Venue) => {
    setVenue(updatedVenue);
    setVenueDraft((prev) => ({
      venueName: updatedVenue?.name ?? prev.venueName,
      description: updatedVenue?.description ?? "",
      address: updatedVenue?.address ?? "",
      capacity: updatedVenue?.capacity ? String(updatedVenue.capacity) : "",
      logoPreview: updatedVenue?.logo_url ?? prev.logoPreview,
      logoDataUrl: null,
      logoFilename: prev.logoFilename,
    }));
    setCurrentStep("session");
  };
  
  const handleSessionComplete = (submittedDraft?: SessionDraft) => {
    if (submittedDraft) {
      setSessionDraft({
        sessionName: submittedDraft.sessionName,
        sessionDescription: submittedDraft.sessionDescription,
        durationHours: submittedDraft.durationHours,
        sessionType: submittedDraft.sessionType,
      });
    }
    setCurrentStep("profile");
  };
  
  // Back button handler
  const handleBack = () => {
    if (currentStep === "session") {
      setCurrentStep("venue");
    } else if (currentStep === "profile") {
      setCurrentStep("session");
    }
  };

  const t = useTranslations("admin.onboarding");
  const tSteps = useTranslations("admin.onboarding.steps");
  
  const steps = [
    { id: "venue", label: tSteps("venue.label"), number: tSteps("venue.number") },
    { id: "session", label: tSteps("session.label"), number: tSteps("session.number") },
    { id: "profile", label: tSteps("profile.label"), number: tSteps("profile.number") },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1629] to-[#1a1f3a]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[rgba(10,16,36,0.9)] px-4 py-6 backdrop-blur-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <SocialWordmark className="text-2xl" />
            <div className="h-6 w-px bg-white/10" />
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-[#6b9eff]">
              {t("header.adminSetup")}
            </span>
          </div>
          <div className="text-xs text-[var(--muted)]">{userEmail}</div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-white/5 bg-[#0a1024] px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                      index <= currentStepIndex
                        ? "border-[#6b9eff] bg-[#1a2a4a] text-[#6b9eff]"
                        : "border-white/10 bg-[#0a0e1a] text-[var(--muted)]"
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="hidden md:block">
                    <div
                      className={`text-sm font-medium ${
                        index <= currentStepIndex ? "text-white" : "text-[var(--muted)]"
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-4 h-px flex-1 bg-white/10">
                    <div
                      className={`h-full transition-all ${
                        index < currentStepIndex ? "bg-[#6b9eff]" : "bg-transparent"
                      }`}
                      style={{ width: index < currentStepIndex ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {currentStep === "venue" && (
            <VenueSetupStep
              venue={venue}
              draft={venueDraft}
              onDraftChange={handleVenueDraftChange}
              onComplete={handleVenueComplete}
              onSubmitSuccess={(savedVenue) => {
                if (savedVenue) {
                  setVenueDraft((prev) => ({
                    venueName: savedVenue.name,
                    description: savedVenue.description ?? "",
                    address: savedVenue.address ?? "",
                    capacity: savedVenue.capacity ? String(savedVenue.capacity) : "",
                    logoPreview: savedVenue.logo_url ?? prev.logoPreview,
                    logoDataUrl: null,
                    logoFilename: null,
                  }));
                }
              }}
              onBack={null}
              canGoBack={false}
            />
          )}
          {currentStep === "session" && venue && (
            <SessionSetupStep
              venueId={venue.id}
              venueName={venue.name}
              draft={sessionDraft}
              onDraftChange={handleSessionDraftChange}
              onComplete={(submittedValues) => handleSessionComplete(submittedValues)}
              onBack={handleBack}
              canGoBack={true}
            />
          )}
          {currentStep === "profile" && (
            <AdminProfileStep 
              profile={profile}
              draft={profileDraft}
              onDraftChange={handleProfileDraftChange}
              onComplete={() => {
                // Clear saved form state before redirecting
                clearSavedState();
                // Redirect after successful profile setup
                // Extract locale from current pathname to ensure correct redirect
                if (typeof window !== "undefined") {
                  const currentPath = window.location.pathname;
                  const pathLocale = currentPath.split('/').filter(Boolean)[0] || locale || 'en';
                  // Use window.location to avoid router locale handling issues
                  window.location.href = `/${pathLocale}/admin`;
                }
              }}
              onBack={handleBack}
              canGoBack={true}
            />
          )}
        </div>
      </main>
    </div>
  );
}

