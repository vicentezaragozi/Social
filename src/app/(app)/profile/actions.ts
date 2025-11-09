"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/lib/supabase/profile";

const profileSchema = z.object({
  display_name: z.string().min(2, "Display name is required."),
  bio: z.string().max(240).optional(),
  is_private: z.coerce.boolean(),
});

export type ProfileUpdateState = {
  error?: string;
  success?: boolean;
};

export async function updateProfileAction(
  prevState: ProfileUpdateState,
  formData: FormData,
): Promise<ProfileUpdateState> {
  const parseResult = profileSchema.safeParse({
    display_name: formData.get("display_name"),
    bio: formData.get("bio") ?? undefined,
    is_private: formData.get("is_private") === "on" || formData.get("is_private") === "true",
  });

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message ?? "Invalid profile details." };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in again." };
  }

  const result = await upsertProfile({
    id: user.id,
    display_name: parseResult.data.display_name,
    bio: parseResult.data.bio ?? null,
    is_private: parseResult.data.is_private,
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/profile");
  revalidatePath("/app");
  return { success: true };
}

