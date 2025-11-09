import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect_to");
  const next = redirectTo ?? "/onboarding";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Supabase exchangeCodeForSession error", error);
      return NextResponse.redirect(
        new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, env.NEXT_PUBLIC_APP_URL),
      );
    }
  }

  return NextResponse.redirect(new URL(next, env.NEXT_PUBLIC_APP_URL));
}

