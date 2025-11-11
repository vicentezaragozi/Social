import { revalidatePath } from "next/cache";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export const getCurrentProfile = async () => {
  const supabase = await getSupabaseServerClient();
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

export const upsertProfile = async (payload: Partial<ProfileInsert>) => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  if (!payload.display_name || payload.display_name.trim().length === 0) {
    return { error: "Display name is required." };
  }

  const insertPayload: ProfileInsert = {
    id: user.id,
    display_name: payload.display_name,
    age: payload.age ?? null,
    id_photo_url: payload.id_photo_url ?? null,
    avatar_url: payload.avatar_url ?? null,
    bio: payload.bio ?? null,
    phone_number: payload.phone_number ?? null,
    gallery_urls: payload.gallery_urls ?? [],
    highlight_tags: payload.highlight_tags ?? [],
    favorite_track_url: payload.favorite_track_url ?? null,
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

