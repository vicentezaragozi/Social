"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// ============================================================================
// VENUE SETUP
// ============================================================================

export type VenueSetupState = {
  error?: string;
  success?: boolean;
  venue?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    address: string | null;
    capacity: number | null;
  };
};

const venueSchema = z.object({
  venueId: z.string().optional(),
  venueName: z.string().min(1, "Venue name is required"),
  description: z.string().optional(),
  logo: z.instanceof(File).optional(),
  logoDataUrl: z.string().optional(),
  logoFilename: z.string().optional(),
  address: z.string().optional(),
  capacity: z.coerce.number().int().positive().optional(),
});

export async function setupVenueAction(
  _prevState: VenueSetupState,
  formData: FormData,
): Promise<VenueSetupState> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const rawData = {
      venueId: formData.get("venueId"),
      venueName: formData.get("venueName"),
      description: formData.get("description") || undefined,
      logo: formData.get("logo"),
      logoDataUrl: (() => {
        const value = formData.get("logoDataUrl");
        return typeof value === "string" && value.length > 0 ? value : undefined;
      })(),
      logoFilename: (() => {
        const value = formData.get("logoFilename");
        return typeof value === "string" && value.length > 0 ? value : undefined;
      })(),
      address: formData.get("address") || undefined,
      capacity: formData.get("capacity") || undefined,
    };

    const parsed = venueSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const data = parsed.data;
    const venueId = data.venueId;

    // Handle logo upload if provided
    let logoUrl: string | null = null;
    if (data.logo && data.logo.size > 0) {
      const fileExt = data.logo.name.split(".").pop() ?? "jpg";
      const fileName = `${user.id}-${Date.now()}-logo.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("venue-media")
        .upload(fileName, data.logo, { upsert: true });

      if (uploadError) {
        console.error("Logo upload error:", uploadError);
        return { error: "Failed to upload logo" };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("venue-media").getPublicUrl(uploadData.path);
      logoUrl = publicUrl;
    } else if (data.logoDataUrl) {
      const matches = data.logoDataUrl.match(/^data:(.*);base64,(.*)$/);
      if (!matches) {
        return { error: "Invalid logo image data" };
      }
      const [, mimeType, base64] = matches;
      const buffer = Buffer.from(base64, "base64");
      const extension =
        data.logoFilename?.split(".").pop() ?? mimeType.split("/")[1] ?? "jpg";
      const fileName = `${user.id}-${Date.now()}-logo.${extension}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("venue-media")
        .upload(fileName, buffer, { contentType: mimeType, upsert: true });

      if (uploadError) {
        console.error("Logo upload error:", uploadError);
        return { error: "Failed to upload logo" };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("venue-media").getPublicUrl(uploadData.path);
      logoUrl = publicUrl;
    }

    if (venueId) {
      // Update existing venue
      const updateData: Record<string, unknown> = {
        name: data.venueName,
      };
      if (data.description) updateData.description = data.description;
      if (logoUrl) updateData.logo_url = logoUrl;
      if (data.address) updateData.address = data.address;
      if (data.capacity) updateData.capacity = data.capacity;

      const { data: venue, error: updateError } = await supabase
        .from("venues")
        .update(updateData)
        .eq("id", venueId)
        .select("id, name, slug, description, logo_url, address, capacity")
        .single();

      if (updateError) {
        console.error("Venue update error:", updateError);
        return { error: "Failed to update venue" };
      }

      return { success: true, venue };
    } else {
      // Get existing venue from membership
      const { data: membership } = await supabase
        .from("venue_memberships")
        .select("venue_id, venues(id, name, slug, description, logo_url, address, capacity)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership?.venues) {
        // Update the existing venue
        const updateData: Record<string, unknown> = {
          name: data.venueName,
        };
        if (data.description) updateData.description = data.description;
        if (logoUrl) updateData.logo_url = logoUrl;
        if (data.address) updateData.address = data.address;
        if (data.capacity) updateData.capacity = data.capacity;

        const { data: venue, error: updateError } = await supabase
          .from("venues")
          .update(updateData)
          .eq("id", membership.venues.id)
          .select("id, name, slug, description, logo_url, address, capacity")
          .single();

        if (updateError) {
          console.error("Venue update error:", updateError);
          return { error: "Failed to update venue" };
        }

        return { success: true, venue };
      }

      return { error: "No venue found. Please contact support." };
    }
  } catch (error) {
    console.error("Venue setup error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// ============================================================================
// SESSION SETUP
// ============================================================================

export type SessionSetupState = {
  error?: string;
  success?: boolean;
  metadata?: {
    id: string;
    session_name: string;
    session_description: string | null;
    duration_hours: number;
    session_type: "event" | "daily" | "weekly" | "custom";
  };
};

const sessionSchema = z.object({
  venueId: z.string().uuid(),
  sessionName: z.string().min(1, "Session name is required"),
  sessionDescription: z.string().optional(),
  durationHours: z.coerce.number().int().min(1).max(168),
  sessionType: z.enum(["event", "daily", "weekly", "custom"]),
});

export async function setupSessionAction(
  _prevState: SessionSetupState,
  formData: FormData,
): Promise<SessionSetupState> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const rawData = {
      venueId: formData.get("venueId"),
      sessionName: formData.get("sessionName"),
      sessionDescription: formData.get("sessionDescription") || undefined,
      durationHours: formData.get("durationHours"),
      sessionType: formData.get("sessionType"),
    };

    const parsed = sessionSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const data = parsed.data;

    // Deactivate existing active sessions for this venue
    await supabase
      .from("session_metadata")
      .update({ is_active: false })
      .eq("venue_id", data.venueId)
      .eq("is_active", true);

    // Create session metadata
    const { data: insertedSession, error: sessionError } = await supabase
      .from("session_metadata")
      .insert({
        venue_id: data.venueId,
        session_name: data.sessionName,
        session_description: data.sessionDescription,
        session_type: data.sessionType,
        duration_hours: data.durationHours,
        is_active: true,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + data.durationHours * 60 * 60 * 1000).toISOString(),
      })
      .select("id, session_name, session_description, session_type, duration_hours")
      .single();

    if (sessionError) {
      console.error("Session creation error:", sessionError);
      return { error: "Failed to create session" };
    }

    // Create an active venue_session for the admin to be "checked in"
    const { error: venueSessionError } = await supabase.from("venue_sessions").insert({
      profile_id: user.id,
      venue_id: data.venueId,
      status: "active",
      entered_at: new Date().toISOString(),
      exited_at: new Date(Date.now() + data.durationHours * 60 * 60 * 1000).toISOString(),
    });

    if (venueSessionError) {
      console.error("Venue session error:", venueSessionError);
      // Non-critical, continue
    }

    return {
      success: true,
      metadata: {
        id: insertedSession.id,
        session_name: insertedSession.session_name,
        session_description: insertedSession.session_description,
        session_type: insertedSession.session_type as "event" | "daily" | "weekly" | "custom",
        duration_hours: insertedSession.duration_hours,
      },
    };
  } catch (error) {
    console.error("Session setup error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// ============================================================================
// ADMIN PROFILE SETUP
// ============================================================================

export type AdminProfileSetupState = {
  error?: string;
  success?: boolean;
};

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().optional(),
  avatar: z.instanceof(File).optional(),
  avatarCropped: z.string().optional(),
});

export async function setupAdminProfileAction(
  _prevState: AdminProfileSetupState,
  formData: FormData,
): Promise<AdminProfileSetupState> {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const rawData = {
      displayName: formData.get("displayName"),
      bio: formData.get("bio") || undefined,
      avatar: formData.get("avatar"),
      avatarCropped: formData.get("avatarCropped") || undefined,
    };

    const parsed = profileSchema.safeParse(rawData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const data = parsed.data;

    // Handle avatar upload
    let avatarUrl: string | null = null;
    if (data.avatarCropped) {
      // Use cropped image
      const base64Data = data.avatarCropped.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `${user.id}-${Date.now()}-avatar.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return { error: "Failed to upload avatar" };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-avatars").getPublicUrl(uploadData.path);
      avatarUrl = publicUrl;
    }

    // Update profile
    const updateData: Record<string, unknown> = {
      display_name: data.displayName,
    };
    if (data.bio) updateData.bio = data.bio;
    if (avatarUrl) updateData.avatar_url = avatarUrl;

    const { error: profileError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return { error: "Failed to update profile" };
    }

    return { success: true };
  } catch (error) {
    console.error("Profile setup error:", error);
    return { error: "An unexpected error occurred" };
  }
}

