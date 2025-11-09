"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";

import type { Database } from "./types";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export const getSupabaseBrowserClient = () => {
  if (!client) {
    client = createBrowserClient<Database>(
      publicEnv.supabaseUrl,
      publicEnv.supabaseAnonKey,
    );
  }

  return client;
};

