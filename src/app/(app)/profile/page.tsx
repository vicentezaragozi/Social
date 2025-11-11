import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile } from "@/lib/supabase/profile";

import { ProfileForm } from "@/components/profile/profile-form";

export const metadata = {
  title: "Your Profile",
};

export default async function ProfilePage() {
  const { user } = await requireAuthSession();
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-semibold">We need a few details first</h1>
        <p className="text-sm text-[var(--muted)]">
          Complete onboarding to unlock your profile controls.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 pb-32 pt-10 text-white">
      <header className="mb-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Your account</p>
        <h1 className="text-2xl font-semibold">Control how others see you.</h1>
        <p className="text-sm text-[var(--muted)]">
          Update your vibe, toggle privacy, or tweak your bio. Staff can still verify info when
          needed.
        </p>
      </header>

      <ProfileForm
        email={user.email ?? ""}
        defaultValues={{
          display_name: profile.display_name,
          phone_number: profile.phone_number,
          bio: profile.bio,
          is_private: profile.is_private,
          avatar_url: profile.avatar_url,
          highlight_tags: profile.highlight_tags ?? [],
          gallery_urls: profile.gallery_urls ?? [],
          favorite_track_url: profile.favorite_track_url,
        }}
      />
    </main>
  );
}

