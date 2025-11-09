export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--surface)] text-center text-[var(--foreground)]">
      <span className="rounded-full border border-[#1d2946] px-4 py-1 text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
        Social MVP
      </span>
      <h1 className="max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">
        Nightlife connections, powered by a single responsive web app.
      </h1>
      <p className="max-w-lg text-sm text-[var(--muted)] sm:text-base">
        The real experience is on mobile. Scan the venue QR code to unlock the
        guest journey or sign in with admin access to manage your floor in real
        time.
      </p>
    </main>
  );
}
