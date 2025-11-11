"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type ToggleState = {
  error?: string;
  success?: boolean;
};

function SubmitButton({ isEnabled }: { isEnabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-semibold uppercase tracking-[0.15em] transition",
        isEnabled
          ? "border border-[#5c2a40] bg-[#301321] text-[#ff8ba7] hover:border-[#ff8ba7]"
          : "border border-[#264b3f] bg-[#122521] text-[#5ef1b5] hover:border-[#5ef1b5]",
        pending && "opacity-50",
      )}
    >
      {pending ? "Saving..." : isEnabled ? "Hide from Feed" : "Show in Feed"}
    </button>
  );
}

export function GuestFeedToggle({
  isEnabled,
  toggleAction,
}: {
  isEnabled: boolean;
  toggleAction: (
    prevState: ToggleState,
    formData: FormData,
  ) => Promise<ToggleState>;
}) {
  const [state, formAction] = useActionState(toggleAction, {});

  useEffect(() => {
    if (state.success) {
      // Optionally refresh or show success message
      window.location.reload();
    }
  }, [state.success]);

  return (
    <div className="rounded-3xl border border-[#223253] bg-[#0d162a] p-6 shadow-lg shadow-black/30">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Appear in Guest Feed</h3>
          <p className="text-sm text-[var(--muted)]">
            {isEnabled
              ? "You're visible to guests with a blue Staff badge. You can send and receive vibes like any guest."
              : "Enable this to appear in the guest connect feed. Guests will see you with a blue Staff badge."}
          </p>
          {state.error && (
            <p className="text-sm text-[#ff8ba7]">{state.error}</p>
          )}
        </div>
        <form action={formAction} className="shrink-0">
          <SubmitButton isEnabled={isEnabled} />
        </form>
      </div>
    </div>
  );
}

