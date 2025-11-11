"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import * as bcrypt from "bcryptjs";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export type AdminSignInState = {
  error?: string;
};

export async function adminSignInAction(
  _prevState: AdminSignInState,
  formData: FormData,
): Promise<AdminSignInState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await getSupabaseServerClient();

  // First, check if admin credentials exist for this email
  const { data: adminCred, error: credError } = await supabase
    .from("admin_credentials")
    .select("profile_id, password_hash")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  console.log("Admin lookup:", { email: email.toLowerCase(), found: !!adminCred, error: credError });

  if (!adminCred) {
    console.log("No admin credentials found for email:", email);
    return { error: "Invalid email or password" };
  }

  console.log("Checking password...");
  // Verify password
  const isValidPassword = await bcrypt.compare(password, adminCred.password_hash);
  console.log("Password valid:", isValidPassword);
  
  if (!isValidPassword) {
    console.log("Password mismatch for email:", email);
    return { error: "Invalid email or password" };
  }

  // Check profile_id exists
  if (!adminCred.profile_id) {
    return { error: "Admin account not properly configured." };
  }

  // Use service role to create an admin session
  const cookieStore = await cookies();
  const supabaseAdmin = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  // Sign in using OTP (bypassing email)
  const { data: otpData, error: otpError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: email.toLowerCase(),
  });

  if (otpError || !otpData) {
    console.error("OTP generation error:", otpError);
    return { error: "Failed to create session. Please try again." };
  }

  // Use the token_hash to verify and create session
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: otpData.properties.hashed_token,
  });

  if (verifyError) {
    console.error("Verify OTP error:", verifyError);
    return { error: "Failed to authenticate. Please try again." };
  }

  // Check if onboarding is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", adminCred.profile_id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("venue_memberships")
    .select("venue_id")
    .eq("user_id", adminCred.profile_id)
    .maybeSingle();

  const { data: sessionMeta } = membership
    ? await supabase
        .from("session_metadata")
        .select("id")
        .eq("venue_id", membership.venue_id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  // Redirect to onboarding if not complete
  if (!membership || !sessionMeta || !profile?.display_name || !profile?.avatar_url) {
    redirect("/sign-in/admin/onboarding");
  }

  // Success - redirect to admin dashboard
  redirect("/admin");
}

