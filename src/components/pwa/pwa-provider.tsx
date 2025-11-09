"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PWAContextValue = {
  isInstallable: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
  hasInstalled: boolean;
};

const PWAContext = createContext<PWAContextValue | null>(null);

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
};

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [hasInstalled, setHasInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setHasInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    const isSecureContext =
      window.location.protocol === "https:" || window.location.hostname === "localhost";

    if ("serviceWorker" in navigator && isSecureContext) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => console.error("Service worker registration failed", error));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const value = useMemo<PWAContextValue>(
    () => ({
      isInstallable: deferredPrompt !== null,
      install: async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setHasInstalled(true);
        }
        setDeferredPrompt(null);
      },
      dismiss: () => setDeferredPrompt(null),
      hasInstalled,
    }),
    [deferredPrompt, hasInstalled],
  );

  return (
    <PWAContext.Provider value={value}>
      {children}
      <InstallBanner />
    </PWAContext.Provider>
  );
}

function InstallBanner() {
  const { isInstallable, install, dismiss, hasInstalled } = usePWA();

  if (!isInstallable || hasInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 rounded-3xl border border-[#223253] bg-[#0d162a] px-6 py-4 shadow-xl shadow-black/40 backdrop-blur-sm md:right-auto md:left-auto md:bottom-6 md:max-w-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#223253] bg-[#101b33] text-xl">
          📱
        </div>
        <div className="flex-1 space-y-1 text-sm text-white">
          <p className="font-semibold">Add Social to your home screen</p>
          <p className="text-xs text-[var(--muted)]">
            Install the web app for full-screen access and quicker re-entry into the venue.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          className="rounded-xl border border-[#223253] px-3 py-1 uppercase tracking-[0.2em] text-[var(--muted)] transition hover:text-white"
          onClick={dismiss}
        >
          Later
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#2f9b7a] px-3 py-1 uppercase tracking-[0.2em] text-[#5ef1b5] transition hover:text-white"
          onClick={install}
        >
          Install
        </button>
      </div>
    </div>
  );
}

