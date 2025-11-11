"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const TUTORIAL_SEEN_KEY = "social:tutorial-seen";

export function TutorialModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

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
    router.push("/app");
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
          <h2 className="text-2xl font-bold text-white">Welcome to Social!</h2>
          <p className="text-sm text-[var(--muted)]">
            Here&apos;s how to connect with others at the venue
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a2847] text-lg">
              👁️
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">Browse the deck</h3>
              <p className="text-sm text-[var(--muted)]">
                Swipe through guests currently at the venue. Check out their photos, bio, and vibe.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a2847] text-lg">
              ✨
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">Send vibes</h3>
              <p className="text-sm text-[var(--muted)]">
                Tap &quot;Send vibe&quot; on profiles that catch your eye. They&apos;ll get a
                notification in their Matches tab.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a2847] text-lg">
              💬
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">Match & chat</h3>
              <p className="text-sm text-[var(--muted)]">
                When you both send vibes and accept, you unlock WhatsApp chat—no awkward number
                exchanges on the floor.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleDismiss}
          className="w-full rounded-2xl bg-gradient-to-r from-[#8a2be2] to-[#6a1bb2] py-3 font-semibold text-white transition hover:from-[#9a3bf2] hover:to-[#7a2bc2]"
        >
          Start connecting
        </button>
      </div>
    </div>
  );
}

