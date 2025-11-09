import { revalidatePath } from "next/cache";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const getCurrentProfile = async () => {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    console.error("Failed to load profile", error);
    return null;
  }

  return data;
};

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export const upsertProfile = async (payload: ProfileInsert) => {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const insertPayload: ProfileInsert = {
    id: user.id,
    display_name: payload.display_name,
    age: payload.age,
    id_photo_url: payload.id_photo_url,
    avatar_url: payload.avatar_url ?? null,
    bio: payload.bio ?? null,
    is_private: payload.is_private ?? false,
    last_seen_at: payload.last_seen_at ?? new Date().toISOString(),
    blocked_until: payload.blocked_until ?? null,
    blocked_reason: payload.blocked_reason ?? null,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  };

  const { error, data } = await supabase
    .from("profiles")
    .upsert(insertPayload, { onConflict: "id" })
    .select()
    .maybeSingle<ProfileRow>();

  if (error) {
    console.error("Failed to upsert profile", error);
    return { error: error.message };
  }

  revalidatePath("/onboarding");
  return { data };
};

