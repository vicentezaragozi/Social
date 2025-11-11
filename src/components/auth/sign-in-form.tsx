"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInWithEmail, type SignInState } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

const initialState: SignInState = {};

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={cn(
        "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold tracking-wide text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        "disabled:cursor-not-allowed disabled:bg-[#312d4b] disabled:text-[var(--muted)]",
        className,
      )}
      disabled={pending}
    >
      <span className="relative z-10">
        {pending ? "Sending magic link..." : "Send magic link"}
      </span>
      <div className="absolute inset-0 translate-y-full bg-[var(--accent-strong)] transition group-hover:translate-y-0" />
    </button>
  );
}

export function SignInForm({ venueId }: { venueId?: string }) {
  const [state, formAction] = useActionState(signInWithEmail, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {venueId && <input type="hidden" name="venueId" value={venueId} />}
      
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted)]"
        >
          Email
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@email.com"
            required
            className="w-full rounded-2xl border border-[#233050] bg-[var(--surface-raised)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            OTP
          </div>
        </div>
      </div>

      <SubmitButton />

      {state.error ? (
        <p className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-2 text-xs text-[#ff8ba7]">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-2xl border border-[#264b3f] bg-[#0f201a] px-4 py-2 text-xs text-[#5ef1b5]">
          Magic link sent. Check your inbox to continue.
        </p>
      ) : null}
    </form>
  );
}

