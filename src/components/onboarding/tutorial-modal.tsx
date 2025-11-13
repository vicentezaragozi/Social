"use client";

import { useRouter } from "@/i18n";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";

const TUTORIAL_SEEN_KEY = "social:tutorial-seen";

export function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("app.connect.tutorial");

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check if tutorial has been seen
    const hasSeenTutorial = localStorage.getItem(TUTORIAL_SEEN_KEY);
    if (!hasSeenTutorial) {
      // Small delay so it doesn't appear instantly
      setTimeout(() => setIsOpen(true), 500);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    }
    setIsOpen(false);
    // Extract locale from current pathname to ensure correct redirect
    const currentPath = window.location.pathname;
    const pathLocale = currentPath.split('/').filter(Boolean)[0] || locale || 'en';
    // Use window.location to avoid router locale handling issues
    window.location.href = `/${pathLocale}/app`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[#273763] bg-[#0b1224] p-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#8a2be2] to-[#4a148c]">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{t("title")}</h2>
          <p className="text-sm text-[var(--muted)]">
            {t("description")}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a2847] text-lg">
              👁️
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">{t("browseDeck.title")}</h3>
              <p className="text-sm text-[var(--muted)]">
                {t("browseDeck.description")}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a2847] text-lg">
              ✨
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">{t("sendVibes.title")}</h3>
              <p className="text-sm text-[var(--muted)]">
                {t("sendVibes.description")}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a2847] text-lg">
              💬
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">{t("matchChat.title")}</h3>
              <p className="text-sm text-[var(--muted)]">
                {t("matchChat.description")}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleDismiss}
          className="w-full rounded-2xl bg-gradient-to-r from-[#8a2be2] to-[#6a1bb2] py-3 font-semibold text-white transition hover:from-[#9a3bf2] hover:to-[#7a2bc2]"
        >
          {t("startConnecting")}
        </button>
      </div>
    </div>
  );
}

