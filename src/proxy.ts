import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export default async function proxy(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          res.cookies.set({
            name,
            value,
            ...(options as Record<string, string>),
          });
        },
        remove(name: string, options: Record<string, unknown>) {
          res.cookies.delete({
            name,
            ...(options as Record<string, string>),
          });
        },
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const redirectUrl = new URL("/sign-in/admin", req.url);
    redirectUrl.searchParams.set("error", "admin_required");
    return NextResponse.redirect(redirectUrl, { headers: res.headers });
  }

  const { data: membership } = await supabase
    .from("venue_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    const redirectUrl = new URL("/sign-in/admin", req.url);
    redirectUrl.searchParams.set("error", "admin_required");
    return NextResponse.redirect(redirectUrl, { headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};


