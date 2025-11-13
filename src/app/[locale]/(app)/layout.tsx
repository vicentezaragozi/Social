import "@/app/globals.css";

import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { BlockedNotice } from "@/components/app/blocked-notice";
import { getCurrentProfile, getProfileBlockStatus } from "@/lib/supabase/profile";
import { getActiveSessionMetadata } from "@/lib/supabase/session";
import { getDefaultVenue } from "@/lib/supabase/venues";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale;
  const profile = await getCurrentProfile();

  const venue = await getDefaultVenue();
  const activeMetadata = await getActiveSessionMetadata(venue.id);

  if (!activeMetadata) {
    // Ensure locale is valid before redirecting
    const validLocale = (locale && typeof locale === 'string' && ['en', 'es'].includes(locale)) 
      ? locale 
      : 'en';
    redirect(`/${validLocale}?error=session_inactive`);
  }

  const { isBlocked } = getProfileBlockStatus(profile);

  return (
    <AppShell 
      currentUserAvatar={profile?.avatar_url ?? null}
      currentUserName={profile?.display_name ?? "Guest"}
    >
      {profile && isBlocked ? <BlockedNotice profile={profile} /> : children}
    </AppShell>
  );
}

