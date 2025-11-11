"use server";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";

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
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const venueId = String(formData.get("venueId") ?? "");

  if (!email) {
    return { error: "Please enter an email address." };
  }

  const supabase = await getSupabaseServerClient();

  // Check if this email belongs to an admin
  const { data: adminCred } = await supabase
    .from("admin_credentials")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (adminCred) {
    redirect("/sign-in/admin?error=admin_email");
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
      redirect(`/sign-in?venue=${venueId}&error=no_active_session`);
    }

    if (sessionMeta.end_time && new Date(sessionMeta.end_time) <= new Date()) {
      await deactivateSessionNow(sessionMeta.id);
      redirect(`/sign-in?venue=${venueId}&error=no_active_session`);
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: new URL(CALLBACK_PATH, env.NEXT_PUBLIC_APP_URL).toString(),
    },
  });

  if (error) {
    console.error("Supabase OTP error", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function requireAuthSession() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return { user, session };
}

