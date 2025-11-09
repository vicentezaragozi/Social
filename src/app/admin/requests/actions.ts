"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminVenue } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  requestId: z.string().uuid(),
  venueId: z.string().uuid(),
  status: z.enum(["pending", "completed", "cancelled"]),
});

export type SongQueueState = {
  error?: string;
  success?: boolean;
};

export async function updateSongRequestStatus(
  prev: SongQueueState,
  formData: FormData,
): Promise<SongQueueState> {
  const parsed = updateSchema.safeParse({
    requestId: formData.get("requestId"),
    venueId: formData.get("venueId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission." };
  }

  const { venueId, requestId, status } = parsed.data;

  await requireAdminVenue(venueId);
  const supabase = await getSupabaseServerClient();

  const updates: Record<string, string | null> = {
    status,
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from("song_requests")
    .update(updates)
    .eq("id", requestId)
    .eq("venue_id", venueId);

  if (error) {
    console.error("Failed to update song request", error);
    return { error: "Could not update request. Try again." };
  }

  revalidatePath("/admin/requests");
  return { success: true };
}

