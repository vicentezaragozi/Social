"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";

import { deactivateSessionNow } from "./session";
import { getSupabaseServerClient } from "./server";

export type SignInState = {
  error?: string;
  success?: boolean;
};

const CALLBACK_PATH = "/auth/callback";

export async function signInWithEmail(
  prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const t = await getTranslations("auth.signIn.form.errors");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const venueId = String(formData.get("venueId") ?? "");

  // Get locale from cookies
  let locale: AppLocale = routing.defaultLocale;
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get?.("NEXT_LOCALE")?.value;
    if (cookieLocale && routing.locales.includes(cookieLocale as AppLocale)) {
      locale = cookieLocale as AppLocale;
    }
  } catch {
    // Ignore cookie access issues and fall back to default locale
  }

  if (!email) {
    return { error: t("emailRequired") };
  }

  const supabase = await getSupabaseServerClient();

  // Check if this email belongs to an admin
  const { data: adminCred } = await supabase
    .from("admin_credentials")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (adminCred) {
    redirect(`/${locale}/sign-in/admin?error=admin_email`);
  }

  // Check if venue has an active session
  if (venueId) {
    const { data: sessionMeta } = await supabase
      .from("session_metadata")
      .select("id, end_time")
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sessionMeta) {
      redirect(`/${locale}/sign-in?venue=${venueId}&error=no_active_session`);
    }

    if (sessionMeta.end_time && new Date(sessionMeta.end_time) <= new Date()) {
      await deactivateSessionNow(sessionMeta.id);
      redirect(`/${locale}/sign-in?venue=${venueId}&error=no_active_session`);
    }
  }

  // Include locale in callback URL
  const callbackUrl = new URL(`/${locale}${CALLBACK_PATH}`, env.NEXT_PUBLIC_APP_URL).toString();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error("Supabase OTP error", error);
    return { error: t("generic") };
  }

  return { success: true };
}

export async function signOutAction() {
  // Get locale from cookies
  let locale: AppLocale = routing.defaultLocale;
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get?.("NEXT_LOCALE")?.value;
    if (cookieLocale && routing.locales.includes(cookieLocale as AppLocale)) {
      locale = cookieLocale as AppLocale;
    }
  } catch {
    // Ignore cookie access issues and fall back to default locale
  }

  // Ensure locale is valid before redirecting
  const validLocale = locale && routing.locales.includes(locale) ? locale : routing.defaultLocale;

  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${validLocale}/sign-in`);
}

export async function requireAuthSession() {
  // Get locale from cookies
  let locale: AppLocale = routing.defaultLocale;
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get?.("NEXT_LOCALE")?.value;
    if (cookieLocale && routing.locales.includes(cookieLocale as AppLocale)) {
      locale = cookieLocale as AppLocale;
    }
  } catch {
    // Ignore cookie access issues and fall back to default locale
  }

  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { user, session };
}

