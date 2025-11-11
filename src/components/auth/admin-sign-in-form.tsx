"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adminSignInAction, type AdminSignInState } from "@/app/(auth)/sign-in/admin/actions";

const initialState: AdminSignInState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff6b9d] to-[#c33764] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <>
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Signing in...
        </>
      ) : (
        "Sign in as Admin"
      )}
    </button>
  );
}

export function AdminSignInForm() {
  const [state, formAction] = useActionState(adminSignInAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-base text-white placeholder-[var(--muted)] transition-colors focus:border-[#3d4f7f] focus:outline-none focus:ring-2 focus:ring-[#3d4f7f]/30"
          placeholder="admin@venue.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium uppercase tracking-[0.15em] text-[var(--muted)]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-2xl border border-[#233050] bg-[#0a1024] px-5 py-4 text-base text-white placeholder-[var(--muted)] transition-colors focus:border-[#3d4f7f] focus:outline-none focus:ring-2 focus:ring-[#3d4f7f]/30"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <div className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-3 text-sm text-[#ff8ba7]">
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

