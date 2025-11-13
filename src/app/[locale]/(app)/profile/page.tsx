import { getTranslations } from "next-intl/server";

import { requireAuthSession } from "@/lib/supabase/auth";
import { getCurrentProfile } from "@/lib/supabase/profile";

import { ProfileForm } from "@/components/profile/profile-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.profile" });
  return {
    title: t("title"),
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user } = await requireAuthSession();
  const profile = await getCurrentProfile();
  const t = await getTranslations({ locale, namespace: "app.profile" });

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6 py-16 text-center text-white">
        <h1 className="text-3xl font-semibold">{t("onboardingRequired.title")}</h1>
        <p className="text-sm text-[var(--muted)]">
          {t("onboardingRequired.description")}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 pb-32 pt-10 text-white">
      <header className="mb-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">{t("header.subtitle")}</p>
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <p className="text-sm text-[var(--muted)]">
          {t("header.description")}
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

