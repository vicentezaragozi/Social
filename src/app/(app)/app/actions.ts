"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildWhatsAppLink } from "@/lib/util/whatsapp";

const interactionSchema = z.object({
  receiverId: z.string().uuid(),
  type: z.enum(["like", "invite"]),
  sessionId: z.string().uuid(),
  message: z.string().max(240).optional(),
});

export type InteractionActionState = {
  error?: string;
  success?: boolean;
};

export async function sendInteractionAction(
  prevState: InteractionActionState,
  formData: FormData,
): Promise<InteractionActionState> {
  const parseResult = interactionSchema.safeParse({
    receiverId: formData.get("receiverId"),
    type: formData.get("type"),
    sessionId: formData.get("sessionId"),
    message: formData.get("message") ?? undefined,
  });

  if (!parseResult.success) {
    return { error: "Missing or invalid interaction details." };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in again." };
  }

  const { data: senderSession, error: sessionError } = await supabase
    .from("venue_sessions")
    .select("id, venue_id")
    .eq("id", parseResult.data.sessionId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (sessionError || !senderSession) {
    return { error: "Active session not found. Refresh and try again." };
  }

  const { data: existingInteraction } = await supabase
    .from("interactions")
    .select("id, status")
    .eq("sender_id", user.id)
    .eq("receiver_id", parseResult.data.receiverId)
    .eq("interaction_type", parseResult.data.type)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingInteraction && existingInteraction.status === "pending") {
    return { success: true };
  }

  const { error: insertError } = await supabase.from("interactions").insert({
    sender_id: user.id,
    receiver_id: parseResult.data.receiverId,
    interaction_type: parseResult.data.type,
    message: parseResult.data.message ?? null,
    venue_session_id: senderSession.id,
    status: "pending",
  });

  if (insertError) {
    console.error("Failed to send interaction", insertError);
    return { error: "Could not send interaction. Try again in a moment." };
  }

  revalidatePath("/app");
  return { success: true };
}

const responseSchema = z.object({
  interactionId: z.string().uuid(),
  action: z.enum(["accept", "decline"]),
});

export async function respondInteractionAction(
  prevState: InteractionActionState,
  formData: FormData,
): Promise<InteractionActionState> {
  const parseResult = responseSchema.safeParse({
    interactionId: formData.get("interactionId"),
    action: formData.get("action"),
  });

  if (!parseResult.success) {
    return { error: "Invalid response." };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in again." };
  }

  const { data: interaction, error } = await supabase
    .from("interactions")
    .select("id, sender_id, receiver_id, status, interaction_type, created_at")
    .eq("id", parseResult.data.interactionId)
    .eq("receiver_id", user.id)
    .maybeSingle();

  if (error || !interaction) {
    return { error: "Invite not found or already handled." };
  }

  if (interaction.status !== "pending") {
    return { success: true };
  }

  const status = parseResult.data.action === "accept" ? "accepted" : "declined";

  const { error: updateError } = await supabase
    .from("interactions")
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq("id", interaction.id)
    .eq("receiver_id", user.id);

  if (updateError) {
    console.error("Failed to respond to interaction", updateError);
    return { error: "Unable to update invite. Try again." };
  }

  if (status === "accepted") {
    const { data: reciprocal } = await supabase
      .from("interactions")
      .select("id, status")
      .eq("sender_id", user.id)
      .eq("receiver_id", interaction.sender_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reciprocal?.status === "accepted") {
      const [profileA, profileB] =
        user.id < interaction.sender_id
          ? [user.id, interaction.sender_id]
          : [interaction.sender_id, user.id];

      const { data: existingMatch } = await supabase
        .from("matches")
        .select("id")
        .eq("profile_a", profileA)
        .eq("profile_b", profileB)
        .maybeSingle();

      if (!existingMatch) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", [profileA, profileB]);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]));

        const displayA = profileMap.get(profileA) ?? "Guest";
        const displayB = profileMap.get(profileB) ?? "Guest";

        const whatsappMessage = `¡Hey! It's ${displayA} — we matched on Social tonight. Save my contact (${displayB}) and let's keep the vibe going ✨`;

        const whatsappUrl = buildWhatsAppLink(whatsappMessage);

        const { error: matchError } = await supabase.from("matches").insert({
          interaction_id: interaction.id,
          profile_a: profileA,
          profile_b: profileB,
          whatsapp_url: whatsappUrl,
        });

        if (matchError) {
          console.error("Failed to create match", matchError);
        }
      }
    }
  }

  revalidatePath("/matches");
  revalidatePath("/app");
  return { success: true };
}

