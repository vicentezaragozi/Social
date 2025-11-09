import { redirect } from "next/navigation";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile } from "@/lib/supabase/profile";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireAuthSession();
  const profile = await getCurrentProfile();

  if (profile?.id_photo_url && profile.display_name && profile.age) {
    redirect("/app");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start bg-[var(--background)] px-4 pb-16 pt-10">
      <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top,var(--surface-raised)_0%,transparent_70%)] opacity-60" />
      <div className="w-full max-w-xl space-y-6">
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
            email: session.user.email ?? "",
          }}
        />
      </div>
    </div>
  );
}

