"use server";

import { Buffer } from "node:buffer";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfile } from "@/lib/supabase/profile";

const profileSchema = z.object({
  display_name: z.string().min(2, "Display name is required."),
  phone_number: z.string().optional(),
  bio: z.string().max(240).optional(),
  is_private: z.coerce.boolean(),
  highlight_tags: z.string().optional(),
  existing_gallery: z.string().optional(),
  favorite_track_url: z
    .string()
    .url("Share a valid link.")
    .optional()
    .or(z.literal("")),
});

const GALLERY_BUCKET = "profile-gallery";
const AVATAR_BUCKET = "profile-avatars";

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
    phone_number: formData.get("phone_number") ?? undefined,
    bio: formData.get("bio") ?? undefined,
    is_private: formData.get("is_private") === "on" || formData.get("is_private") === "true",
    highlight_tags: formData.get("highlight_tags") ?? undefined,
    existing_gallery: formData.get("existing_gallery") ?? undefined,
    favorite_track_url: formData.get("favorite_track_url") ?? undefined,
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

  const parseHighlightTags = (raw: string | undefined) => {
    const fallback = raw ?? "[]";
    try {
      const parsed = JSON.parse(fallback);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
        .slice(0, 5)
        .map((tag) => tag.slice(0, 32));
    } catch (error) {
      console.warn("Failed to parse highlight tags", error);
      return [];
    }
  };

  const parseExistingGallery = (raw: string | undefined) => {
    const fallback = raw ?? "[]";
    try {
      const parsed = JSON.parse(fallback);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((value) => (typeof value === "string" ? value : ""))
        .filter(Boolean)
        .slice(0, 6);
    } catch (error) {
      console.warn("Failed to parse existing gallery payload", error);
      return [];
    }
  };

  const highlightTags = parseHighlightTags(parseResult.data.highlight_tags);
  const existingGallery = parseExistingGallery(parseResult.data.existing_gallery);
  const favoriteTrackUrl = (() => {
    const raw = (parseResult.data.favorite_track_url ?? "").trim();
    return raw.length ? raw : null;
  })();

  const galleryFiles = formData
    .getAll("gallery_photos")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, 4);
  const croppedAvatarDataUrl = formData.get("cropped_avatar");
  const existingAvatarRaw = formData.get("existing_avatar");
  const removeAvatar = formData.get("remove_avatar") === "1";

  const { data: currentProfile, error: profileFetchError } = await supabase
    .from("profiles")
    .select("gallery_urls, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileFetchError) {
    console.error("Failed to fetch existing profile", profileFetchError);
    return { error: "Could not load your current profile. Try again." };
  }

  const currentGallery = currentProfile?.gallery_urls ?? [];
  const currentAvatar = currentProfile?.avatar_url ?? null;
  const removedFromGallery = currentGallery.filter(
    (url) => !existingGallery.includes(url),
  );

  const extractStoragePath = (publicUrl: string, bucket: string) => {
    try {
      const parsed = new URL(publicUrl);
      const marker = `/storage/v1/object/public/${bucket}/`;
      const index = parsed.pathname.indexOf(marker);
      if (index === -1) return null;
      return decodeURIComponent(parsed.pathname.slice(index + marker.length));
    } catch {
      return null;
    }
  };

  if (removedFromGallery.length) {
    const keys = removedFromGallery
      .map((url) => extractStoragePath(url, GALLERY_BUCKET))
      .filter((key): key is string => Boolean(key));
    if (keys.length) {
      const { error: removeError } = await supabase.storage.from(GALLERY_BUCKET).remove(keys);
      if (removeError) {
        console.warn("Failed to remove gallery assets", removeError);
      }
    }
  }

  const galleryUrls = [...existingGallery];
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

  const existingAvatarUrl =
    typeof existingAvatarRaw === "string" && existingAvatarRaw.length ? existingAvatarRaw : null;
  let avatarUrl = currentAvatar ?? existingAvatarUrl;
  let avatarToDelete: string | null = null;

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
      avatarToDelete = currentAvatar;
      avatarUrl = avatarPublicUrl;
    }
  } else if (removeAvatar) {
    avatarToDelete = currentAvatar ?? existingAvatarUrl;
    avatarUrl = null;
  }

  if (avatarToDelete) {
    const avatarKey = extractStoragePath(avatarToDelete, AVATAR_BUCKET);
    if (avatarKey) {
      const { error: avatarRemoveError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([avatarKey]);
      if (avatarRemoveError) {
        console.warn("Failed to remove avatar asset", avatarRemoveError);
      }
    }
  }

  const limitedGallery = galleryUrls.slice(0, 4);

  const phoneNumber = (() => {
    const raw = (parseResult.data.phone_number ?? "").trim();
    return raw.length ? raw : null;
  })();

  const result = await upsertProfile({
    id: user.id,
    display_name: parseResult.data.display_name,
    phone_number: phoneNumber,
    bio: parseResult.data.bio ?? null,
    is_private: parseResult.data.is_private,
    avatar_url: avatarUrl,
    gallery_urls: limitedGallery,
    highlight_tags: highlightTags,
    favorite_track_url: favoriteTrackUrl,
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/profile");
  revalidatePath("/app");
  return { success: true };
}

