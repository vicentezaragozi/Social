import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile } from "@/lib/supabase/profile";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { user } = await requireAuthSession();
  const profile = await getCurrentProfile();

  const backHref = profile ? "/app" : "/sign-in";

  if (profile?.id_photo_url && profile.display_name && profile.age) {
    redirect("/app");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start bg-[var(--background)] px-4 pb-16 pt-10 sm:px-6">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top,var(--surface-raised)_0%,transparent_70%)] opacity-60" />
      <div className="flex w-full max-w-xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-[#223253] px-3 py-2 text-xs font-medium uppercase tracking-[0.3em] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-white"
          >
            ← Back
          </Link>
          <span className="text-xs text-[var(--muted)]">Step 1 of 1</span>
        </div>
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            Step 1 · Profile setup
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Almost there. Tell the venue who you are.
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Your name and age stay private with the venue team. Guests only see
            what you make public.
          </p>
        </header>
        <OnboardingForm
          defaultValues={{
            display_name: profile?.display_name ?? "",
            age: profile?.age ?? undefined,
            is_private: profile?.is_private ?? false,
            bio: profile?.bio ?? "",
            avatar_url: profile?.avatar_url ?? null,
            email: user.email ?? "",
            highlight_tags: profile?.highlight_tags ?? [],
            favorite_track_url: profile?.favorite_track_url ?? null,
          }}
        />
      </div>
    </div>
  );
}

