"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

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
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations("common.pwa");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("social:pwa-banner-collapsed");
    setCollapsed(stored === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (collapsed) {
      window.localStorage.setItem("social:pwa-banner-collapsed", "1");
    } else {
      window.localStorage.removeItem("social:pwa-banner-collapsed");
    }
  }, [collapsed]);

  if (hasInstalled) {
    return null;
  }

  if (collapsed) {
    return (
      <button
        type="button"
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0))] left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-[#223253] bg-[#0d162a] text-2xl text-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.65)] transition hover:border-[#2f9b7a] hover:scale-110 md:bottom-6"
        onClick={() => setCollapsed(false)}
        aria-label={t("showPrompt")}
      >
        📱
      </button>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0))] left-6 z-50 w-[min(90vw,320px)] rounded-3xl border border-[#223253] bg-[#0d162a] px-6 py-5 shadow-xl shadow-black/40 backdrop-blur-sm md:bottom-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#223253] bg-[#101b33] text-xl">
          📱
        </div>
        <div className="flex-1 space-y-1 text-sm text-white">
          <p className="font-semibold">{t("title")}</p>
          <p className="text-xs text-[var(--muted)]">
            {t("description")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#223253] text-sm text-[var(--muted)] transition hover:text-white"
          aria-label={t("minimizePrompt")}
        >
          –
        </button>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          className="rounded-xl border border-[#223253] px-3 py-1 uppercase tracking-[0.2em] text-[var(--muted)] transition hover:text-white"
          onClick={() => {
            setCollapsed(true);
          }}
        >
          {t("later")}
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#2f9b7a] px-3 py-1 uppercase tracking-[0.2em] text-[#5ef1b5] transition hover:text-white"
          onClick={install}
        >
          {t("install")}
        </button>
      </div>
    </div>
  );
}

