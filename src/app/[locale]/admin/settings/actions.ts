"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { deactivateSessionNow } from "@/lib/supabase/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type VenueSettingsState = {
  error?: string;
  success?: boolean;
};

export type SessionSettingsState = {
  error?: string;
  success?: boolean;
  sessionId?: string;
};

export type SessionToggleState = {
  error?: string;
  success?: boolean;
};

const MAX_GALLERY_ITEMS = 12;

const venueSettingsSchema = z.object({
  venueId: z.string().uuid(),
  venueName: z.string().min(1, "Venue name is required"),
  description: z.string().max(2000).optional(),
  address: z.string().max(500).optional(),
  capacity: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
    .pipe(z.number().int().min(0).max(50000).optional()),
  websiteUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => !value || /^https?:\/\//i.test(value),
      "Website must start with http:// or https://",
    ),
  instagramHandle: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.replace(/^@/, "") : undefined))
    .refine((value) => !value || value.length <= 64, "Instagram handle is too long"),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) => !value || /^[\d\s()+\-]+$/.test(value),
      "Phone number contains invalid characters",
    ),
  amenities: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
        : [],
    ),
  keepGallery: z.array(z.string().url()).max(MAX_GALLERY_ITEMS),
});

export async function updateVenueSettingsAction(
  _prev: VenueSettingsState,
  formData: FormData,
): Promise<VenueSettingsState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in again." };
  }

  const keepGalleryRaw = formData.get("keepGalleryUrls");
  let keepGallery: string[] = [];
  if (typeof keepGalleryRaw === "string" && keepGalleryRaw.trim().length) {
    try {
      const parsed = JSON.parse(keepGalleryRaw);
      if (Array.isArray(parsed)) {
        keepGallery = parsed.filter((entry): entry is string => typeof entry === "string");
      }
    } catch (error) {
      console.error("Failed to parse keepGalleryUrls", error);
      return { error: "Unable to process existing gallery selection." };
    }
  }

  const rawData = {
    venueId: formData.get("venueId"),
    venueName: formData.get("venueName"),
    description: formData.get("description"),
    address: formData.get("address"),
    capacity: formData.get("capacity"),
    websiteUrl: formData.get("websiteUrl"),
    instagramHandle: formData.get("instagramHandle"),
    phoneNumber: formData.get("phoneNumber"),
    amenities: formData.get("amenities"),
    keepGallery,
  };

  const parsed = venueSettingsSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid venue details." };
  }
  const data = parsed.data;

  // Ensure membership
  const { data: membership } = await supabase
    .from("venue_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("venue_id", data.venueId)
    .maybeSingle();
  if (!membership) {
    return { error: "You do not have access to this venue." };
  }

  try {
    const uploadPromises: Promise<string | null>[] = [];
    const files = formData.getAll("galleryFiles");
    for (const [index, file] of files.entries()) {
      if (!(file instanceof File) || file.size === 0) {
        continue;
      }
      if (!file.type.startsWith("image/")) {
        return { error: `File ${file.name} must be an image.` };
      }
      if (data.keepGallery.length + uploadPromises.length >= MAX_GALLERY_ITEMS) {
        break;
      }

      const promise = (async () => {
        const fileExt = file.name.split(".").pop() ?? "jpg";
        const path = `gallery/${data.venueId}/${Date.now()}-${index}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("venue-media")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          console.error("Gallery upload error", uploadError);
          throw new Error("Failed to upload gallery image.");
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("venue-media").getPublicUrl(uploadData.path);
        return publicUrl;
      })();

      uploadPromises.push(promise);
    }

    const uploadedGallery = await Promise.all(uploadPromises);
    const galleryUrls = [...data.keepGallery, ...uploadedGallery.filter(Boolean)] as string[];

    const logo = formData.get("logo");
    let logoUrl: string | null = null;
    if (logo instanceof File && logo.size > 0) {
      if (!logo.type.startsWith("image/")) {
        return { error: "Logo must be an image file." };
      }
      const fileExt = logo.name.split(".").pop() ?? "jpg";
      const path = `logos/${data.venueId}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("venue-media")
        .upload(path, logo, { upsert: true });
      if (uploadError) {
        console.error("Logo upload error", uploadError);
        return { error: "Failed to upload logo." };
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("venue-media").getPublicUrl(uploadData.path);
      logoUrl = publicUrl;
    }

    const updatePayload: Record<string, unknown> = {
      name: data.venueName,
      description: data.description ?? null,
      address: data.address ?? null,
      capacity: data.capacity ?? null,
      website_url: data.websiteUrl ?? null,
      instagram_handle: data.instagramHandle ?? null,
      phone_number: data.phoneNumber ?? null,
      amenities: data.amenities,
      gallery_urls: galleryUrls,
    };

    const cover = formData.get("coverImage");
    if (cover instanceof File && cover.size > 0) {
      if (!cover.type.startsWith("image/")) {
        return { error: "Cover image must be an image file." };
      }
      const fileExt = cover.name.split(".").pop() ?? "jpg";
      const path = `covers/${data.venueId}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("venue-media")
        .upload(path, cover, { upsert: true });
      if (uploadError) {
        console.error("Cover upload error", uploadError);
        return { error: "Failed to upload cover image." };
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("venue-media").getPublicUrl(uploadData.path);
      updatePayload.cover_image_url = publicUrl;
    }

    if (logoUrl) {
      updatePayload.logo_url = logoUrl;
    }

    const { error: venueError } = await supabase
      .from("venues")
      .update(updatePayload)
      .eq("id", data.venueId);

    if (venueError) {
      console.error("Venue update error", venueError);
      return { error: "Unable to update venue settings right now." };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Failed to update venue settings", error);
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}

const sessionSettingsSchema = z.object({
  venueId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  sessionName: z.string().min(1, "Session name is required"),
  sessionDescription: z.string().max(2000).optional(),
  durationHours: z.coerce.number().int().min(1).max(168, "Duration must be between 1h and 1w"),
  sessionType: z.enum(["event", "daily", "weekly", "custom"]),
  entryFee: z
    .string()
    .optional()
    .transform((value) => (value ? Number.parseFloat(value) : undefined))
    .pipe(
      z
        .number()
        .min(0, "Entry fee cannot be negative")
        .max(100000, "Entry fee is too large")
        .optional(),
    ),
  entryFeeCurrency: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.toUpperCase() : "USD"))
    .refine((value) => value.length === 3, "Currency code must be 3 letters"),
});

export async function updateSessionSettingsAction(
  _prev: SessionSettingsState,
  formData: FormData,
): Promise<SessionSettingsState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in again." };
  }

  const rawData = {
    venueId: formData.get("venueId"),
    sessionId: formData.get("sessionId") || undefined,
    sessionName: formData.get("sessionName"),
    sessionDescription: formData.get("sessionDescription") || undefined,
    durationHours: formData.get("durationHours"),
    sessionType: formData.get("sessionType"),
    entryFee: formData.get("entryFee"),
    entryFeeCurrency: formData.get("entryFeeCurrency"),
  };

  const parsed = sessionSettingsSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid session details." };
  }
  const data = parsed.data;

  const { data: membership } = await supabase
    .from("venue_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("venue_id", data.venueId)
    .maybeSingle();
  if (!membership) {
    return { error: "You do not have access to this venue." };
  }

  try {
    const entryFeeCents =
      typeof data.entryFee === "number" ? Math.round(data.entryFee * 100) : null;

    if (data.sessionId) {
      const { error: updateError } = await supabase
        .from("session_metadata")
        .update({
          session_name: data.sessionName,
          session_description: data.sessionDescription ?? null,
          session_type: data.sessionType,
          duration_hours: data.durationHours,
          start_time: new Date().toISOString(),
          end_time: data.durationHours
            ? new Date(Date.now() + data.durationHours * 60 * 60 * 1000).toISOString()
            : null,
          entry_fee_cents: entryFeeCents,
          entry_fee_currency: data.entryFeeCurrency ?? "USD",
        })
        .eq("id", data.sessionId)
        .eq("venue_id", data.venueId);

      if (updateError) {
        console.error("Session update error", updateError);
        return { error: "Unable to update session configuration." };
      }

      revalidatePath("/admin/settings");
      revalidatePath("/admin");

      return { success: true, sessionId: data.sessionId };
    }

    // Deactivate any active sessions
    await supabase
      .from("session_metadata")
      .update({ is_active: false })
      .eq("venue_id", data.venueId)
      .eq("is_active", true);

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + data.durationHours * 60 * 60 * 1000);

    const { data: inserted, error: insertError } = await supabase
      .from("session_metadata")
      .insert({
        venue_id: data.venueId,
        session_name: data.sessionName,
        session_description: data.sessionDescription,
        session_type: data.sessionType,
        duration_hours: data.durationHours,
        is_active: true,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        entry_fee_cents: entryFeeCents,
        entry_fee_currency: data.entryFeeCurrency ?? "USD",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Session insert error", insertError);
      return { error: "Failed to create new session." };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin");

    return { success: true, sessionId: inserted.id };
  } catch (error) {
    console.error("Failed to update session settings", error);
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    };
  }
}

const sessionToggleSchema = z.object({
  venueId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export async function deactivateSessionAction(
  _prev: SessionToggleState,
  formData: FormData,
): Promise<SessionToggleState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in again." };
  }

  const rawData = {
    venueId: formData.get("venueId"),
    sessionId: formData.get("sessionId"),
  };

  const parsed = sessionToggleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Invalid session details." };
  }

  const membership = await supabase
    .from("venue_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("venue_id", parsed.data.venueId)
    .maybeSingle();

  if (!membership.data) {
    return { error: "You do not have access to this venue." };
  }

  try {
    await deactivateSessionNow(parsed.data.sessionId);

    revalidatePath("/admin/settings");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Failed to deactivate session", error);
    return { error: "Unable to deactivate session right now." };
  }
}

export async function activateSessionAction(
  _prev: SessionToggleState,
  formData: FormData,
): Promise<SessionToggleState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in again." };
  }

  const rawData = {
    venueId: formData.get("venueId"),
    sessionId: formData.get("sessionId"),
  };

  const parsed = sessionToggleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Invalid session details." };
  }

  const membership = await supabase
    .from("venue_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("venue_id", parsed.data.venueId)
    .maybeSingle();

  if (!membership.data) {
    return { error: "You do not have access to this venue." };
  }

  const { data: session, error: fetchError } = await supabase
    .from("session_metadata")
    .select("id, venue_id, duration_hours")
    .eq("id", parsed.data.sessionId)
    .maybeSingle();

  if (fetchError || !session) {
    console.error("Failed to load session for activation", fetchError);
    return { error: "Session not found." };
  }

  const now = new Date();
  const endTime = new Date(now.getTime() + session.duration_hours * 60 * 60 * 1000);

  try {
    await supabase
      .from("session_metadata")
      .update({
        is_active: true,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
      })
      .eq("id", session.id)
      .eq("venue_id", session.venue_id);

    await supabase
      .from("session_metadata")
      .update({ is_active: false })
      .eq("venue_id", session.venue_id)
      .neq("id", session.id);

    revalidatePath("/admin/settings");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Failed to activate session", error);
    return { error: "Unable to activate session right now." };
  }
}


