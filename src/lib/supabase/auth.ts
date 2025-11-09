"use server";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";

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

  if (!email) {
    return { error: "Please enter an email address." };
  }

  const supabase = getSupabaseServerClient();

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
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function requireAuthSession() {
  const supabase = getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

