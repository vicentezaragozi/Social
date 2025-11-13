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

const offerFormSchema = z.object({
  offerId: z.string().uuid().optional(),
  venueId: z.string().uuid(),
  title: z.string().trim().min(3, "Title is required."),
  description: z.string().trim().max(600).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  priority: z.coerce.number().int().min(0).max(999).default(0),
  ctaLabel: z.string().trim().max(80).optional(),
  ctaUrl: z.string().url("Link must be valid.").optional(),
  imageUrl: z.string().url("Image must be a valid URL.").optional(),
  promoCode: z.string().trim().max(80).optional(),
  isActive: z.coerce.boolean().optional(),
});

const deleteSchema = z.object({
  offerId: z.string().uuid(),
  venueId: z.string().uuid(),
});

const redemptionStatusSchema = z.object({
  redemptionId: z.string().uuid(),
  offerId: z.string().uuid(),
  venueId: z.string().uuid(),
  mark: z.enum(["redeemed", "pending"]),
});

export type OfferUpdateState = {
  error?: string;
  success?: boolean;
};

export type OfferFormState = OfferUpdateState & {
  offerId?: string;
};

const toOptionalString = (value: FormDataEntryValue | null): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const toBoolean = (value: FormDataEntryValue | null): boolean | undefined => {
  if (typeof value !== "string") return undefined;
  return value === "true" || value === "on" ? true : value === "false" ? false : undefined;
};

const normalizeDateTime = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

export async function saveOfferAction(
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const candidate = {
    offerId: toOptionalString(formData.get("offerId")),
    venueId: toOptionalString(formData.get("venueId")),
    title: toOptionalString(formData.get("title")),
    description: toOptionalString(formData.get("description")),
    startAt: toOptionalString(formData.get("startAt")),
    endAt: toOptionalString(formData.get("endAt")),
    priority: formData.get("priority"),
    ctaLabel: toOptionalString(formData.get("ctaLabel")),
    ctaUrl: toOptionalString(formData.get("ctaUrl")),
    imageUrl: toOptionalString(formData.get("imageUrl")),
    promoCode: toOptionalString(formData.get("promoCode")),
    isActive: toBoolean(formData.get("isActive")),
  };

  const parsed = offerFormSchema.safeParse(candidate);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid offer details." };
  }

  const data = parsed.data;
  const startAtIso = normalizeDateTime(data.startAt);
  const endAtIso = normalizeDateTime(data.endAt);

  if (data.startAt && !startAtIso) {
    return { error: "Start date must be a valid date/time." };
  }

  if (data.endAt && !endAtIso) {
    return { error: "End date must be a valid date/time." };
  }

  if (startAtIso && endAtIso && new Date(startAtIso) > new Date(endAtIso)) {
    return { error: "End date must be after the start date." };
  }

  await requireAdminVenue(data.venueId);
  const supabase = await getSupabaseServerClient();

  const payload = {
    title: data.title,
    description: data.description ?? null,
    cta_label: data.ctaLabel ?? null,
    cta_url: data.ctaUrl ?? null,
    image_url: data.imageUrl ?? null,
    start_at: startAtIso ?? new Date().toISOString(),
    end_at: endAtIso ?? null,
    is_active: data.isActive ?? true,
    priority: data.priority ?? 0,
    promo_code: data.promoCode ?? null,
  };

  let error: { message: string } | null = null;

  if (data.offerId) {
    const response = await supabase
      .from("offers")
      .update(payload)
      .eq("id", data.offerId)
      .eq("venue_id", data.venueId);

    error = response.error;
  } else {
    const response = await supabase.from("offers").insert({
      ...payload,
      venue_id: data.venueId,
    });
    error = response.error;
  }

  if (error) {
    console.error("Failed to save offer", error);
    return { error: "Unable to save offer." };
  }

  revalidatePath("/admin/offers");
  revalidatePath("/app");
  return { success: true, offerId: data.offerId };
}

export async function deleteOfferAction(
  _prev: OfferUpdateState,
  formData: FormData,
): Promise<OfferUpdateState> {
  const parsed = deleteSchema.safeParse({
    offerId: formData.get("offerId"),
    venueId: formData.get("venueId"),
  });

  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const { offerId, venueId } = parsed.data;
  await requireAdminVenue(venueId);

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("offers").delete().eq("id", offerId).eq("venue_id", venueId);

  if (error) {
    console.error("Failed to delete offer", error);
    return { error: "Unable to delete offer." };
  }

  revalidatePath("/admin/offers");
  revalidatePath("/app");
  return { success: true };
}

export async function updateOfferRedemptionStatus(
  _prev: OfferUpdateState,
  formData: FormData,
): Promise<OfferUpdateState> {
  const parsed = redemptionStatusSchema.safeParse({
    redemptionId: formData.get("redemptionId"),
    offerId: formData.get("offerId"),
    venueId: formData.get("venueId"),
    mark: formData.get("mark"),
  });

  if (!parsed.success) {
    return { error: "Invalid redemption update." };
  }

  const { redemptionId, offerId, venueId, mark } = parsed.data;
  await requireAdminVenue(venueId);

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("offer_redemptions")
    .update({
      status: mark === "redeemed" ? "redeemed" : "accepted",
      redeemed_at: mark === "redeemed" ? new Date().toISOString() : null,
    })
    .eq("id", redemptionId)
    .eq("offer_id", offerId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to update redemption status", error);
    return { error: "Unable to update redemption." };
  }

  revalidatePath("/admin/offers");
  return { success: true };
}

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
  revalidatePath("/app");
  return { success: true };
}

