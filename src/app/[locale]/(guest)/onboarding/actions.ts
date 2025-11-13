"use server";

import { Buffer } from "node:buffer";

import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/lib/supabase/profile";

const onboardingSchema = z.object({
  display_name: z.string().min(2, "Name is required."),
  age: z.coerce.number().min(18, "You must be 18 or older."),
  phone_number: z.string().optional(),
  is_private: z.coerce.boolean(),
  bio: z.string().max(240).optional(),
  highlight_tags: z.string().optional(),
  favorite_track_url: z
    .string()
    .url("Share a valid link.")
    .optional()
    .or(z.literal("")),
});

const ID_BUCKET = "id-photos";
const GALLERY_BUCKET = "profile-gallery";
const AVATAR_BUCKET = "profile-avatars";

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
    phone_number: formData.get("phone_number") ?? undefined,
    is_private: formData.get("is_private") === "on" || formData.get("is_private") === "true",
    bio: formData.get("bio") ?? undefined,
    highlight_tags: formData.get("highlight_tags") ?? undefined,
    favorite_track_url: formData.get("favorite_track_url") ?? undefined,
  });

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message ?? "Invalid form input." };
  }

  const file = formData.get("id_photo");
  const croppedDataUrl = formData.get("cropped_id_photo");
  const croppedAvatarDataUrl = formData.get("cropped_avatar");
  const existingAvatarRaw = formData.get("existing_avatar");
  const removeAvatar = formData.get("remove_avatar") === "1";
  const galleryFiles = formData
    .getAll("gallery_photos")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, 4);

  let uploadBuffer: Buffer | null = null;
  let contentType = "image/jpeg";

  if (typeof croppedDataUrl === "string" && croppedDataUrl.startsWith("data:")) {
    const [metadata, base64] = croppedDataUrl.split(",", 2);
    const mimeMatch = metadata?.match(/^data:([^;]+);/);
    contentType = mimeMatch?.[1] ?? "image/jpeg";
    uploadBuffer = Buffer.from(base64 ?? "", "base64");
  } else if (file instanceof File && file.size) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: "ID photo must be under 5 MB." };
    }
    contentType = file.type || "image/jpeg";
    const arrayBuffer = await file.arrayBuffer();
    uploadBuffer = Buffer.from(arrayBuffer);
  }

  if (!uploadBuffer || uploadBuffer.length === 0) {
    return { error: "Please upload a photo of your ID." };
  }

  if (uploadBuffer.length > 5 * 1024 * 1024) {
    return { error: "ID photo must be under 5 MB." };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "You need to sign in again." };
  }

  const mimeExtension = contentType.split("/")[1]?.split("+")[0] ?? "jpg";
  const objectKey = `${user.id}/id-${Date.now()}.${mimeExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(ID_BUCKET)
    .upload(objectKey, uploadBuffer, {
      contentType: contentType,
      upsert: true,
    });

  if (uploadError) {
    console.error("Failed to upload ID photo", uploadError);
    const status = (uploadError as { status?: number }).status;
    if (status === 404 || uploadError.message?.includes("Bucket not found")) {
      return {
        error:
          "Storage bucket 'id-photos' is missing. Ask an admin to create it in Supabase Storage and retry.",
      };
    }
    return { error: "Could not upload ID photo. Try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(ID_BUCKET).getPublicUrl(objectKey);

  const existingAvatarUrl =
    typeof existingAvatarRaw === "string" && existingAvatarRaw.length ? existingAvatarRaw : "";
  let avatarUrl: string | null = existingAvatarUrl && !removeAvatar ? existingAvatarUrl : null;

  if (typeof croppedAvatarDataUrl === "string" && croppedAvatarDataUrl.startsWith("data:")) {
    const [metadata, base64] = croppedAvatarDataUrl.split(",", 2);
    const avatarContentType = metadata?.match(/^data:([^;]+);/)?.[1] ?? "image/jpeg";
    const avatarBuffer = Buffer.from(base64 ?? "", "base64");

    if (avatarBuffer.length > 5 * 1024 * 1024) {
      return { error: "Profile photo must be under 5 MB." };
    }

    if (avatarBuffer.length > 0) {
      const avatarExtension = avatarContentType.split("/")[1]?.split("+")[0] ?? "jpg";
      const avatarKey = `${user.id}/avatar-${Date.now()}.${avatarExtension}`;
      const { error: avatarUploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(avatarKey, avatarBuffer, {
          contentType: avatarContentType,
          upsert: true,
        });

      if (avatarUploadError) {
        console.error("Failed to upload avatar", avatarUploadError);
        const status = (avatarUploadError as { status?: number }).status;
        if (status === 404 || avatarUploadError.message?.includes("Bucket not found")) {
          return {
            error:
              "Storage bucket 'profile-avatars' is missing. Ask an admin to create it in Supabase Storage and retry.",
          };
        }
        return { error: "Could not upload profile photo. Try again." };
      }

      const {
        data: { publicUrl: avatarPublicUrl },
      } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarKey);
      avatarUrl = avatarPublicUrl;
    }
  } else if (removeAvatar) {
    avatarUrl = null;
  }

  const highlightTagsRaw = parseResult.data.highlight_tags ?? "[]";
  let highlightTags: string[] = [];
  try {
    const parsed = JSON.parse(highlightTagsRaw);
    if (Array.isArray(parsed)) {
      highlightTags = parsed
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean)
        .slice(0, 5)
        .map((tag) => tag.slice(0, 32));
    }
  } catch (error) {
    console.warn("Failed to parse highlight tags during onboarding", error);
  }

  const galleryUrls: string[] = [];
  for (const [index, galleryFile] of galleryFiles.entries()) {
    if (galleryFile.size > 5 * 1024 * 1024) {
      return { error: "Gallery photos must be under 5 MB each." };
    }
    const galleryArrayBuffer = await galleryFile.arrayBuffer();
    const galleryBuffer = Buffer.from(galleryArrayBuffer);
    const galleryExtension = galleryFile.type.split("/")[1]?.split("+")[0] ?? "jpg";
    const galleryKey = `${user.id}/gallery-${Date.now()}-${index}.${galleryExtension}`;

    const { error: galleryUploadError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(galleryKey, galleryBuffer, {
        contentType: galleryFile.type || "image/jpeg",
        upsert: true,
      });

    if (galleryUploadError) {
      console.error("Failed to upload gallery photo", galleryUploadError);
      const status = (galleryUploadError as { status?: number }).status;
      if (status === 404 || galleryUploadError.message?.includes("Bucket not found")) {
        return {
          error:
            "Storage bucket 'profile-gallery' is missing. Ask an admin to create it in Supabase Storage and retry.",
        };
      }
      return { error: "Could not upload gallery photo. Try again." };
    }

    const {
      data: { publicUrl: galleryUrl },
    } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(galleryKey);
    galleryUrls.push(galleryUrl);
  }

  const favoriteTrackUrl = (() => {
    const raw = (parseResult.data.favorite_track_url ?? "").trim();
    return raw.length ? raw : null;
  })();

  const phoneNumber = (() => {
    const raw = (parseResult.data.phone_number ?? "").trim();
    return raw.length ? raw : null;
  })();

  const { error: profileError } = await upsertProfile({
    display_name: parseResult.data.display_name,
    age: parseResult.data.age,
    phone_number: phoneNumber,
    is_private: parseResult.data.is_private,
    bio: parseResult.data.bio ?? null,
    id_photo_url: publicUrl,
    avatar_url: avatarUrl,
     gallery_urls: galleryUrls,
     highlight_tags: highlightTags,
     favorite_track_url: favoriteTrackUrl,
  });

  if (profileError) {
    return { error: profileError };
  }

  return { success: true };
}

