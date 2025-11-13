import { getTranslations } from "next-intl/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Link } from "@/i18n";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { SocialWordmark } from "@/components/brand/social-wordmark";
import { deactivateSessionNow } from "@/lib/supabase/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.signIn" });
  return {
    title: t("title"),
  };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ venue?: string; error?: string }>;
};

export default async function SignInPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { venue: venueId, error } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth.signIn" });
  
  // If no venue selected, redirect to landing page (locale-aware redirect)
  if (!venueId) {
    redirect(`/${locale}?error=no_venue_selected`);
  }

  // Verify venue exists and get details
  const supabase = await getSupabaseServerClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, logo_url")
    .eq("id", venueId)
    .maybeSingle();

  if (!venue) {
    redirect(`/${locale}?error=invalid_venue`);
  }

  const { data: activeSession } = await supabase
    .from("session_metadata")
    .select("id, end_time")
    .eq("venue_id", venue.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeSession) {
    redirect(`/${locale}?error=no_active_session`);
  }

  if (activeSession.end_time && new Date(activeSession.end_time) <= new Date()) {
    await deactivateSessionNow(activeSession.id);
    redirect(`/${locale}?error=no_active_session`);
  }
  return (
    <div className="mobile-safe flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-16">
      <div className="w-full max-w-md space-y-8 rounded-[32px] border border-[#1d2946] bg-[var(--surface)]/95 p-8 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.75)] backdrop-blur">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full border border-[#2b3a63] bg-[var(--surface-raised)] px-5 py-2">
            <SocialWordmark compact />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{t("header.title", { venue: venue.name })}</h1>
            <p className="text-sm text-[var(--muted)]">
              {t("header.description")}
            </p>
          </div>
        </div>
        
        {error && (
          <div className="rounded-2xl border border-[#5c2a40] bg-[#301321] px-4 py-3 text-sm text-[#ff8ba7]">
            {error === "admin_email" && t("errors.adminEmail")}
            {error === "no_active_session" && t("errors.noActiveSession")}
          </div>
        )}
        
        <div className="pt-2">
          <SignInForm venueId={venue.id} />
        </div>
        
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <Link
            href="/"
            locale={locale}
            className="underline decoration-dotted underline-offset-4 hover:text-white"
          >
            {t("links.changeVenue")}
          </Link>
          <Link
            href="/sign-in/admin"
            locale={locale}
            className="underline decoration-dotted underline-offset-4 hover:text-white"
          >
            {t("links.venueStaff")}
          </Link>
        </div>
      </div>
    </div>
  );
}

