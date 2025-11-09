import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

import type { Database } from "./types";

export const getSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  const mutableCookies = cookieStore as unknown as {
    set?: (
      name: string,
      value: string,
      options?: Record<string, unknown>,
    ) => void;
    delete?: (name: string, options?: Record<string, unknown>) => void;
  };

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (
          name: string,
          value: string,
          options?: Record<string, unknown>,
        ) => {
          mutableCookies.set?.(name, value, options);
        },
        remove: (
          name: string,
          options?: Record<string, unknown>,
        ) => {
          mutableCookies.delete?.(name, options);
        },
      },
    },
  );
};

