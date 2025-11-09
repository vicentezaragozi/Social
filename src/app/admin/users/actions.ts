"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminVenue } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  profileId: z.string().uuid(),
  venueId: z.string().uuid(),
  action: z.enum(["block", "unblock"]),
  duration: z.enum(["1h", "24h", "7d", "permanent"]).optional(),
  reason: z.string().max(200).optional(),
});

export type UpdateUserState = {
  error?: string;
  success?: boolean;
};

export async function updateGuestStatus(
  prev: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  const parsed = updateSchema.safeParse({
    profileId: formData.get("profileId"),
    venueId: formData.get("venueId"),
    action: formData.get("action"),
    duration: formData.get("duration") ?? undefined,
    reason: formData.get("reason") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission." };
  }

  const { venueId, action, duration, reason, profileId } = parsed.data;

  await requireAdminVenue(venueId);
  const supabase = await getSupabaseServerClient();

  let blockedUntil: string | null = null;
  if (action === "block") {
    const now = new Date();
    switch (duration) {
      case "1h":
        now.setHours(now.getHours() + 1);
        blockedUntil = now.toISOString();
        break;
      case "24h":
        now.setHours(now.getHours() + 24);
        blockedUntil = now.toISOString();
        break;
      case "7d":
        now.setDate(now.getDate() + 7);
        blockedUntil = now.toISOString();
        break;
      case "permanent":
      default:
        blockedUntil = null;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      blocked_until: action === "unblock" ? null : blockedUntil,
      blocked_reason: action === "unblock" ? null : reason ?? null,
    })
    .eq("id", profileId);

  if (error) {
    console.error("Failed to update guest status", error);
    return { error: "Could not update guest status. Try again." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true };
}

