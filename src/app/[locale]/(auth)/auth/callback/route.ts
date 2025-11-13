import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale: rawLocale } = await params;
  
  // Extract locale from URL path as fallback if params are undefined
  const requestUrl = new URL(request.url);
  const pathLocale = requestUrl.pathname.split("/")[1];
  
  // Ensure locale is valid, fallback to default if undefined or invalid
  let locale: AppLocale = routing.defaultLocale;
  if (rawLocale && routing.locales.includes(rawLocale as AppLocale)) {
    locale = rawLocale as AppLocale;
  } else if (pathLocale && routing.locales.includes(pathLocale as AppLocale)) {
    locale = pathLocale as AppLocale;
  }

  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect_to");
  
  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Supabase exchangeCodeForSession error", error);
      return NextResponse.redirect(
        new URL(`/${locale}/sign-in?error=${encodeURIComponent(error.message)}`, env.NEXT_PUBLIC_APP_URL),
      );
    }

    // Check if user has completed onboarding
    const profile = await getCurrentProfile();
    const hasCompletedOnboarding = profile?.id_photo_url && profile?.display_name && profile?.age;
    
    // Determine redirect destination
    let next: string;
    if (redirectTo) {
      // If redirect_to is provided, use it (with locale prefix if needed)
      next = redirectTo.startsWith("/") 
        ? `/${locale}${redirectTo}` 
        : `/${locale}/${redirectTo}`;
    } else if (hasCompletedOnboarding) {
      // User has completed onboarding, redirect to app
      next = `/${locale}/app`;
    } else {
      // User hasn't completed onboarding, redirect to onboarding
      next = `/${locale}/onboarding`;
    }

    return NextResponse.redirect(new URL(next, env.NEXT_PUBLIC_APP_URL));
  }

  // No code provided, redirect to sign-in
  return NextResponse.redirect(
    new URL(`/${locale}/sign-in?error=missing_code`, env.NEXT_PUBLIC_APP_URL),
  );
}

