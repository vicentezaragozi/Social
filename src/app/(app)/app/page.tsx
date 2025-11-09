import Link from "next/link";

export const metadata = {
  title: "App Home",
};

export default function AppLanding() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6 py-16 text-center text-white">
      <div className="space-y-3">
        <span className="rounded-full border border-[#1d2946] px-4 py-1 text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
          Coming soon
        </span>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Guest experience is loading.
        </h1>
        <p className="max-w-md text-sm text-[var(--muted)]">
          Once the connect screen, matches, and offers are ready, you&apos;ll land
          here after setting up your profile.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-2xl border border-[#1d2946] px-5 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-white"
      >
        Back to home
      </Link>
    </main>
  );
}

