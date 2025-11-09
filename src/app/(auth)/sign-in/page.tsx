import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="relative w-full max-w-md rounded-[32px] border border-[#1d2946] bg-[var(--surface)]/90 p-8 shadow-lg shadow-black/30 backdrop-blur-sm">
        <div className="absolute inset-x-12 -top-12 flex justify-center">
          <div className="rounded-2xl border border-[#2b3a63] bg-[var(--surface-raised)] px-5 py-2 text-xs font-medium uppercase tracking-[0.4em] text-[var(--muted)]">
            Social
          </div>
        </div>
        <div className="mt-6 space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-white">Sign in</h1>
          <p className="text-sm text-[var(--muted)]">
            Enter your email to receive a magic link. No passwords, just vibes.
          </p>
        </div>
        <div className="mt-8">
          <SignInForm />
        </div>
        <p className="mt-8 text-center text-xs text-[var(--muted)]">
          Admin access?{" "}
          <Link
            href="/admin"
            className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Continue to the dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

