"use server";

import { Buffer } from "node:buffer";

import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/lib/supabase/profile";

const onboardingSchema = z.object({
  display_name: z.string().min(2, "Name is required."),
  age: z.coerce.number().min(18, "You must be 18 or older."),
  is_private: z.coerce.boolean(),
  bio: z.string().max(240).optional(),
});

const ID_BUCKET = "id-photos";

export type OnboardingState = {
  error?: string;
  success?: boolean;
};

export async function completeOnboarding(
  prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parseResult = onboardingSchema.safeParse({
    display_name: formData.get("display_name"),
    age: formData.get("age"),
    is_private: formData.get("is_private") === "on" || formData.get("is_private") === "true",
    bio: formData.get("bio") ?? undefined,
  });

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message ?? "Invalid form input." };
  }

  const file = formData.get("id_photo");
  if (!(file instanceof File) || !file.size) {
    return { error: "Please upload a photo of your ID." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "ID photo must be under 5 MB." };
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You need to sign in again." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const objectKey = `${user.id}/id-${Date.now()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(ID_BUCKET)
    .upload(objectKey, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("Failed to upload ID photo", uploadError);
    return { error: "Could not upload ID photo. Try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(ID_BUCKET).getPublicUrl(objectKey);

  const { error: profileError } = await upsertProfile({
    display_name: parseResult.data.display_name,
    age: parseResult.data.age,
    is_private: parseResult.data.is_private,
    bio: parseResult.data.bio ?? null,
    id_photo_url: publicUrl,
  });

  if (profileError) {
    return { error: profileError };
  }

  return { success: true };
}

