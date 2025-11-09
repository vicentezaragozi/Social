"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminVenue } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const toggleSchema = z.object({
  offerId: z.string().uuid(),
  venueId: z.string().uuid(),
  isActive: z.coerce.boolean(),
});

export type OfferUpdateState = {
  error?: string;
  success?: boolean;
};

export async function toggleOfferStatus(
  prev: OfferUpdateState,
  formData: FormData,
): Promise<OfferUpdateState> {
  const parsed = toggleSchema.safeParse({
    offerId: formData.get("offerId"),
    venueId: formData.get("venueId"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const { offerId, venueId, isActive } = parsed.data;

  await requireAdminVenue(venueId);
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("offers")
    .update({ is_active: isActive })
    .eq("id", offerId)
    .eq("venue_id", venueId);

  if (error) {
    console.error("Failed to toggle offer", error);
    return { error: "Unable to update offer." };
  }

  revalidatePath("/admin/offers");
  return { success: true };
}

